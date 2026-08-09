#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  access,
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  decryptFile,
  encryptFile,
  sha256File,
  verifyChecksumFile,
} from './archive-crypto.mjs';
import { backupStorageObjects } from './storage-backup.mjs';

const ARCHIVE_VERSION = 1;
const REQUIRED_SQL_FILES = [
  'database/roles.sql',
  'database/schema.sql',
  'database/data.sql',
  'database/migrations-schema.sql',
  'database/migrations-data.sql',
  'auth/schema.sql',
  'auth/data.sql',
  'storage/schema.sql',
  'storage/data.sql',
];

function printHelp() {
  console.log(`Tickist encrypted local backup

Create a complete backup:
  npm run db:backup:remote

Verify an existing backup:
  npm run db:backup:verify -- --file=backups/<backup>.enc

Required environment:
  SUPABASE_REMOTE_DB_URL
  NG_APP_SUPABASE_URL (or SUPABASE_URL)
  SUPABASE_PROJECT_REF
  SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY)
  TICKIST_BACKUP_ENCRYPTION_KEY (at least 24 characters)

Optional environment:
  TICKIST_BACKUP_OUTPUT_DIR (default: backups)
`);
}

function parseArgs(argv) {
  const options = { help: false, verifyFile: null };
  for (const argument of argv) {
    if (argument === '--help' || argument === '-h') options.help = true;
    else if (argument.startsWith('--file=')) {
      options.verifyFile = argument.slice('--file='.length);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return options;
}

function requireEnv(name, aliases = []) {
  const value = [name, ...aliases]
    .map((key) => process.env[key])
    .find((candidate) => candidate?.trim());
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}.`);
  }
  return value;
}

export function assertEncryptionKey(password) {
  if (password.length < 24) {
    throw new Error(
      'TICKIST_BACKUP_ENCRYPTION_KEY must contain at least 24 characters.'
    );
  }
}

export function resolveProjectTarget(supabaseUrl, databaseUrl, projectRef) {
  const apiUrl = new URL(supabaseUrl);
  const dbUrl = new URL(databaseUrl);
  const isLocal =
    ['127.0.0.1', 'localhost'].includes(apiUrl.hostname) &&
    apiUrl.protocol === 'http:' &&
    apiUrl.port === '54321' &&
    apiUrl.pathname === '/' &&
    !apiUrl.search &&
    !apiUrl.hash &&
    !apiUrl.username &&
    !apiUrl.password &&
    ['127.0.0.1', 'localhost'].includes(dbUrl.hostname) &&
    ['postgres:', 'postgresql:'].includes(dbUrl.protocol) &&
    dbUrl.port === '54322';
  if (isLocal) {
    if (projectRef !== 'local') {
      throw new Error('Local backup requires SUPABASE_PROJECT_REF=local.');
    }
    return { projectRef: 'local', isLocal: true };
  }
  const apiMatch = apiUrl.hostname.match(/^([a-z0-9-]+)\.supabase\.co$/i);
  if (!apiMatch || apiUrl.protocol !== 'https:') {
    throw new Error(
      'NG_APP_SUPABASE_URL must be an exact HTTPS Supabase project URL.'
    );
  }
  if (
    apiUrl.pathname !== '/' ||
    apiUrl.search ||
    apiUrl.hash ||
    apiUrl.username ||
    apiUrl.password ||
    apiUrl.port
  ) {
    throw new Error(
      'NG_APP_SUPABASE_URL must contain only the project origin.'
    );
  }
  if (apiMatch[1] !== projectRef) {
    throw new Error('SUPABASE_PROJECT_REF does not match NG_APP_SUPABASE_URL.');
  }
  const isDirectDatabase =
    dbUrl.hostname === `db.${projectRef}.supabase.co` &&
    dbUrl.username === 'postgres';
  const isPoolerDatabase =
    dbUrl.hostname.endsWith('.pooler.supabase.com') &&
    dbUrl.username === `postgres.${projectRef}`;
  const dbMatches =
    ['postgres:', 'postgresql:'].includes(dbUrl.protocol) &&
    dbUrl.pathname === '/postgres' &&
    (isDirectDatabase || isPoolerDatabase);
  if (!dbMatches) {
    throw new Error(
      'SUPABASE_REMOTE_DB_URL does not match SUPABASE_PROJECT_REF.'
    );
  }
  return { projectRef, isLocal: false };
}

async function runCommand(command, args, options = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env ?? process.env,
      stdio: options.quiet ? ['ignore', 'ignore', 'pipe'] : 'inherit',
    });
    let stderr = '';
    if (options.quiet) {
      child.stderr.on('data', (chunk) => {
        if (stderr.length < 8000) stderr += chunk.toString();
      });
    }
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      const safeStderr = (options.redact ?? [])
        .reduce(
          (value, secret) =>
            secret ? value.replaceAll(secret, '[REDACTED]') : value,
          stderr.trim()
        )
        .slice(0, 8000);
      reject(
        new Error(
          `${command} failed with exit code ${code}${
            safeStderr ? `: ${safeStderr}` : ''
          }`
        )
      );
    });
  });
}

async function dumpDatabase(databaseUrl, payloadRoot) {
  const parsedDatabaseUrl = new URL(databaseUrl);
  const dumpDefinitions = [
    ['database/roles.sql', '--role-only'],
    ['database/schema.sql'],
    [
      'database/data.sql',
      '--data-only',
      '--use-copy',
      '--exclude',
      'storage.buckets_vectors',
      '--exclude',
      'storage.vector_indexes',
    ],
    ['database/migrations-schema.sql', '--schema', 'supabase_migrations'],
    [
      'database/migrations-data.sql',
      '--schema',
      'supabase_migrations',
      '--data-only',
      '--use-copy',
    ],
    ['auth/schema.sql', '--schema', 'auth'],
    ['auth/data.sql', '--schema', 'auth', '--data-only', '--use-copy'],
    ['storage/schema.sql', '--schema', 'storage'],
    ['storage/data.sql', '--schema', 'storage', '--data-only', '--use-copy'],
  ];
  for (const [relativePath, ...flags] of dumpDefinitions) {
    const target = path.join(payloadRoot, relativePath);
    await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
    await runCommand(
      'npx',
      [
        'supabase',
        'db',
        'dump',
        '--db-url',
        databaseUrl,
        '--file',
        target,
        ...flags,
      ],
      {
        quiet: true,
        redact: [databaseUrl, parsedDatabaseUrl.password],
      }
    );
    await chmod(target, 0o600);
    if ((await stat(target)).size === 0) {
      throw new Error(`${relativePath} is empty.`);
    }
    console.log(`Database: created ${relativePath}.`);
  }
}

async function fileManifest(payloadRoot) {
  const result = [];
  for (const relativePath of REQUIRED_SQL_FILES) {
    const absolutePath = path.join(payloadRoot, relativePath);
    const details = await stat(absolutePath);
    result.push({
      path: relativePath,
      size: details.size,
      sha256: await sha256File(absolutePath),
    });
  }
  return result;
}

async function assertSqlContents(payloadRoot) {
  const authData = await readFile(
    path.join(payloadRoot, 'auth/data.sql'),
    'utf8'
  );
  if (
    !authData.includes('COPY "auth"."users"') ||
    !authData.includes('"encrypted_password"')
  ) {
    throw new Error('Auth dump does not contain users and password hashes.');
  }
  const storageData = await readFile(
    path.join(payloadRoot, 'storage/data.sql'),
    'utf8'
  );
  if (
    !storageData.includes('COPY "storage"."buckets"') ||
    !storageData.includes('COPY "storage"."objects"')
  ) {
    throw new Error('Storage metadata dump is incomplete.');
  }
}

function resolveManifestPath(root, relativePath) {
  if (
    typeof relativePath !== 'string' ||
    !relativePath ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error('Backup manifest contains an invalid path.');
  }
  const resolvedRoot = path.resolve(root);
  const resolvedPath = path.resolve(resolvedRoot, relativePath);
  if (
    resolvedPath !== resolvedRoot &&
    !resolvedPath.startsWith(`${resolvedRoot}${path.sep}`)
  ) {
    throw new Error('Backup manifest path escapes the payload directory.');
  }
  return resolvedPath;
}

async function verifyExtractedPayload(payloadRoot) {
  for (const relativePath of REQUIRED_SQL_FILES) {
    await access(path.join(payloadRoot, relativePath));
  }
  await assertSqlContents(payloadRoot);
  const manifest = JSON.parse(
    await readFile(path.join(payloadRoot, 'manifest.json'), 'utf8')
  );
  if (
    manifest.format !== 'tickist-backup' ||
    manifest.version !== ARCHIVE_VERSION
  ) {
    throw new Error('Backup manifest format is invalid.');
  }
  const manifestFilePaths = manifest.files.map((entry) => entry.path).sort();
  if (
    JSON.stringify(manifestFilePaths) !==
    JSON.stringify([...REQUIRED_SQL_FILES].sort())
  ) {
    throw new Error('Backup manifest SQL file list is incomplete.');
  }
  for (const entry of manifest.files) {
    const filePath = resolveManifestPath(payloadRoot, entry.path);
    const details = await stat(filePath);
    if (details.size !== entry.size) {
      throw new Error(`Size mismatch for ${entry.path}.`);
    }
    if ((await sha256File(filePath)) !== entry.sha256) {
      throw new Error(`Checksum mismatch for ${entry.path}.`);
    }
  }
  for (const object of manifest.storage.objects) {
    const objectPath = resolveManifestPath(
      path.join(payloadRoot, 'storage'),
      object.archivePath
    );
    const details = await stat(objectPath);
    if (details.size !== object.size) {
      throw new Error(
        `Storage object size mismatch: ${object.bucketId}/${object.name}.`
      );
    }
    if ((await sha256File(objectPath)) !== object.sha256) {
      throw new Error(
        `Storage object checksum mismatch: ${object.bucketId}/${object.name}.`
      );
    }
  }
  return manifest;
}

async function verifyBackup(backupPath, password) {
  const resolvedBackup = path.resolve(backupPath);
  await verifyChecksumFile(resolvedBackup, `${resolvedBackup}.sha256`);
  const temporaryRoot = await mkdtemp(
    path.join(os.tmpdir(), 'tickist-backup-verify-')
  );
  const archivePath = path.join(temporaryRoot, 'backup.tar.gz');
  const extractedRoot = path.join(temporaryRoot, 'extracted');
  try {
    await decryptFile(resolvedBackup, archivePath, password);
    await mkdir(extractedRoot, { mode: 0o700 });
    await runCommand('tar', ['-xzf', archivePath, '-C', extractedRoot], {
      quiet: true,
    });
    return await verifyExtractedPayload(path.join(extractedRoot, 'payload'));
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

function safeTimestamp(date) {
  return date.toISOString().replace(/[:.]/g, '-');
}

async function createBackup() {
  const databaseUrl = requireEnv('SUPABASE_REMOTE_DB_URL');
  const supabaseUrl = requireEnv('NG_APP_SUPABASE_URL', ['SUPABASE_URL']);
  const projectRef = requireEnv('SUPABASE_PROJECT_REF');
  const serviceRoleKey = requireEnv('SUPABASE_SECRET_KEY', [
    'SUPABASE_SERVICE_ROLE_KEY',
    'SB_SECRET_KEY',
  ]);
  const password = requireEnv('TICKIST_BACKUP_ENCRYPTION_KEY');
  assertEncryptionKey(password);
  const target = resolveProjectTarget(supabaseUrl, databaseUrl, projectRef);
  const outputRoot = path.resolve(
    process.env.TICKIST_BACKUP_OUTPUT_DIR ?? 'backups'
  );
  await mkdir(outputRoot, { recursive: true, mode: 0o700 });
  await chmod(outputRoot, 0o700);
  const temporaryRoot = await mkdtemp(
    path.join(os.tmpdir(), 'tickist-backup-create-')
  );
  const payloadRoot = path.join(temporaryRoot, 'payload');
  const storageRoot = path.join(payloadRoot, 'storage');
  const archivePath = path.join(temporaryRoot, 'backup.tar.gz');
  const createdAt = new Date();
  const baseName = `tickist-${target.projectRef}-${safeTimestamp(createdAt)}`;
  const encryptedPath = path.join(outputRoot, `${baseName}.enc`);
  const checksumPath = `${encryptedPath}.sha256`;
  try {
    await mkdir(payloadRoot, { recursive: true, mode: 0o700 });
    await dumpDatabase(databaseUrl, payloadRoot);
    await assertSqlContents(payloadRoot);
    await mkdir(storageRoot, { recursive: true, mode: 0o700 });
    const storage = await backupStorageObjects({
      supabaseUrl,
      serviceRoleKey,
      outputRoot: storageRoot,
    });
    const manifest = {
      format: 'tickist-backup',
      version: ARCHIVE_VERSION,
      createdAt: createdAt.toISOString(),
      projectRef: target.projectRef,
      source: target.isLocal ? 'local' : 'remote',
      database: {
        postgresUrlHash: createHash('sha256')
          .update(new URL(databaseUrl).hostname)
          .digest('hex'),
      },
      files: await fileManifest(payloadRoot),
      storage,
      restoreNotes: {
        authSessionsRequireOriginalJwtSecret: true,
        platformSecretsIncluded: false,
        oauthAndSmtpConfigurationIncluded: false,
      },
    };
    await writeFile(
      path.join(payloadRoot, 'manifest.json'),
      `${JSON.stringify(manifest, null, 2)}\n`,
      { flag: 'wx', mode: 0o600 }
    );
    await runCommand(
      'tar',
      ['-czf', archivePath, '-C', temporaryRoot, 'payload'],
      { quiet: true }
    );
    await chmod(archivePath, 0o600);
    await encryptFile(archivePath, encryptedPath, password);
    const checksum = await sha256File(encryptedPath);
    await writeFile(
      checksumPath,
      `${checksum}  ${path.basename(encryptedPath)}\n`,
      { flag: 'wx', mode: 0o600 }
    );
    const verified = await verifyBackup(encryptedPath, password);
    console.log(
      `Verified encrypted backup: ${
        verified.storage.objects.length
      } storage object(s), ${(await stat(encryptedPath)).size} bytes.`
    );
    console.log(`Backup: ${encryptedPath}`);
    console.log(`SHA-256: ${checksumPath}`);
  } catch (error) {
    await rm(encryptedPath, { force: true });
    await rm(checksumPath, { force: true });
    throw error;
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }
  const password = requireEnv('TICKIST_BACKUP_ENCRYPTION_KEY');
  assertEncryptionKey(password);
  if (options.verifyFile) {
    const manifest = await verifyBackup(options.verifyFile, password);
    console.log(
      `Backup verified: ${manifest.projectRef}, ${manifest.createdAt}, ${manifest.storage.objects.length} storage object(s).`
    );
    return;
  }
  await createBackup();
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error(
      `Backup failed: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exitCode = 1;
  });
}
