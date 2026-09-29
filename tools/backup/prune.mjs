#!/usr/bin/env node
import { constants } from 'node:fs';
import { lstat, open, readdir, realpath, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyChecksumFile } from './archive-crypto.mjs';

const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

const PROJECT = /^[a-z0-9]{1,64}$/;

export function parsePruneOptions(argv) {
  const options = { apply: false, help: false };
  const seen = new Set();

  for (const argument of argv) {
    const [key, ...parts] = argument.split('=');
    const value = parts.join('=');

    if (seen.has(key)) throw new Error('Duplicate option.');
    seen.add(key);

    if (key === '--help' && !parts.length) options.help = true;
    else if (key === '--apply' && !parts.length) options.apply = true;
    else if (['--dir', '--confirm-dir'].includes(key) && value)
      options[key.slice(2).replace('-', '_')] = value;
    else if (
      ['--project', '--confirm-project'].includes(key) &&
      PROJECT.test(value)
    )
      options[key.slice(2).replace('-', '_')] = value;
    else throw new Error('Invalid option. Use --help.');
  }

  if (!options.help && !options.project)
    throw new Error('--project is required.');

  return options;
}

function snapshot(details) {
  return {
    dev: details.dev,
    ino: details.ino,
    size: details.size,
    mtimeMs: details.mtimeMs,
  };
}

function sameFile(before, after) {
  return (
    before.dev === after.dev &&
    before.ino === after.ino &&
    before.size === after.size &&
    before.mtimeMs === after.mtimeMs
  );
}

export async function planPruning(directory, project, now = Date.now()) {
  if (!PROJECT.test(project)) throw new Error('Invalid project reference.');

  if (!Number.isFinite(now)) throw new Error('Invalid current time.');
  const root = path.resolve(directory);
  const details = await lstat(root);

  if (!details.isDirectory() || (await realpath(root)) !== root)
    throw new Error('Use a real backup directory, without symbolic links.');
  const candidates = [];
  const skipped = [];

  const pattern = new RegExp(
    `^tickist-${project}-(\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}-\\d{3}Z)\\.enc$`
  );

  for (const name of (await readdir(root)).sort()) {
    const match = pattern.exec(name);

    if (!match) continue;

    const iso = match[1].replace(
      /T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z$/,
      'T$1:$2:$3.$4Z'
    );

    const created = Date.parse(iso);

    if (!Number.isFinite(created) || new Date(created).toISOString() !== iso) {
      skipped.push({ file: name, reason: 'invalid creation date' });
      continue;
    }

    if (created > now - RETENTION_MS) continue;
    const archive = await lstat(path.join(root, name));
    let checksum;

    try {
      checksum = await lstat(path.join(root, `${name}.sha256`));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      skipped.push({ file: name, reason: 'missing checksum' });
      continue;
    }

    if (!archive.isFile() || !checksum.isFile()) {
      skipped.push({
        file: name,
        reason: 'not a regular archive/checksum pair',
      });
      continue;
    }

    candidates.push({
      file: name,
      created_at: iso,
      archive: snapshot(archive),
      checksum: snapshot(checksum),
    });
  }

  return {
    directory: root,
    project,
    cutoff: new Date(now - RETENTION_MS).toISOString(),
    candidates,
    skipped,
  };
}

async function assertUnchanged(plan, candidate) {
  if (
    (await realpath(plan.directory)) !== plan.directory ||
    !(await lstat(plan.directory)).isDirectory()
  )
    throw new Error('Backup directory changed.');
  const archive = await lstat(path.join(plan.directory, candidate.file));

  const checksum = await lstat(
    path.join(plan.directory, `${candidate.file}.sha256`)
  );

  if (
    !archive.isFile() ||
    !checksum.isFile() ||
    !sameFile(candidate.archive, archive) ||
    !sameFile(candidate.checksum, checksum)
  )
    throw new Error(
      'A candidate changed after preview. No further files will be deleted.'
    );
}

async function validateHeader(file) {
  const handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW);

  try {
    const buffer = Buffer.alloc(4096);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    const newline = buffer.subarray(0, bytesRead).indexOf(10);

    if (newline < 0) throw new Error('Invalid encrypted backup header.');
    const header = JSON.parse(buffer.subarray(0, newline).toString('utf8'));

    if (
      header.format !== 'tickist-encrypted-backup' ||
      header.version !== 1 ||
      header.cipher !== 'aes-256-gcm' ||
      header.kdf !== 'scrypt' ||
      !/^[a-f0-9]{32}$/.test(header.salt) ||
      !/^[a-f0-9]{24}$/.test(header.iv) ||
      (await handle.stat()).size <= newline + 1 + 16
    )
      throw new Error('Unsupported encrypted backup header.');
  } finally {
    await handle.close();
  }
}

export async function applyPruning(plan, confirmDirectory, confirmProject) {
  if (confirmDirectory !== plan.directory || confirmProject !== plan.project)
    throw new Error(
      '--apply requires matching --confirm-dir and --confirm-project from the preview.'
    );

  // Validate every candidate before any deletion. Never follow symlinks or decrypt user data.
  for (const candidate of plan.candidates) {
    await assertUnchanged(plan, candidate);
    await validateHeader(path.join(plan.directory, candidate.file));
    await verifyChecksumFile(
      path.join(plan.directory, candidate.file),
      path.join(plan.directory, `${candidate.file}.sha256`)
    );
    await assertUnchanged(plan, candidate);
  }

  let deleted = 0;

  for (const candidate of plan.candidates) {
    await assertUnchanged(plan, candidate);
    await unlink(path.join(plan.directory, candidate.file));
    await unlink(path.join(plan.directory, `${candidate.file}.sha256`));
    deleted++;
  }

  return deleted;
}

async function main() {
  const options = parsePruneOptions(process.argv.slice(2));

  if (options.help) {
    console.log(`Tickist local backup retention (30 days)
Preview: npm run db:backup:prune -- --project=PROJECT_REF [--dir=backups]
Delete:  npm run db:backup:prune -- --project=PROJECT_REF --apply --confirm-project=PROJECT_REF --confirm-dir=/absolute/backup/directory
No database connection or decryption key is needed. Preview never deletes files.
Only canonical dated archive/checksum pairs for the selected project are considered.`);

    return;
  }

  const plan = await planPruning(
    options.dir ?? process.env.TICKIST_BACKUP_OUTPUT_DIR ?? 'backups',
    options.project
  );

  console.log(
    JSON.stringify(
      {
        mode: options.apply ? 'apply' : 'preview',
        retention_days: 30,
        ...plan,
      },
      null,
      2
    )
  );

  if (options.apply)
    console.log(
      `Deleted ${await applyPruning(
        plan,
        options.confirm_dir,
        options.confirm_project
      )} expired archive/checksum pair(s).`
    );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error(
      `Backup cleanup failed: ${
        error instanceof Error ? error.message : String(error)
      } Inspect the directory before retrying an interrupted apply.`
    );
    process.exitCode = 1;
  });
}
