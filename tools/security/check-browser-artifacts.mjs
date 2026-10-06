import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { scanBrowserArtifacts } from './browser-artifacts.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const nonce = randomBytes(18).toString('hex');

const fixture = (name) => `tickist_fixture_${name}_${nonce}`;

const localPassword = fixture('local_database_password');

const remotePassword = fixture('remote_database_password');

const forbiddenValues = {
  AWS_ACCESS_KEY_ID: fixture('aws_access_key'),
  AWS_SECRET_ACCESS_KEY: fixture('aws_secret_key'),
  AWS_SESSION_TOKEN: fixture('aws_session_token'),
  SUPABASE_SECRET_KEY: fixture('supabase_secret_key'),
  SUPABASE_SERVICE_ROLE_KEY: fixture('supabase_service_role_key'),
  NG_APP_SUPABASE_SECRET_KEY: fixture('unapproved_ng_app_secret_key'),
  VITE_PRIVATE_SECRET: fixture('unapproved_vite_secret'),
  INTERNAL_FUNCTION_SECRET: fixture('internal_function_secret'),
  ROUTINE_RUNNER_SECRET: fixture('routine_runner_secret'),
  SUPABASE_ACCESS_TOKEN: fixture('supabase_access_token'),
  CLOUDFLARE_API_TOKEN: fixture('cloudflare_api_token'),
  SUPABASE_DB_URL: `postgresql://postgres:${localPassword}@127.0.0.1:54322/postgres`,
  SUPABASE_REMOTE_DB_URL: `postgresql://postgres:${remotePassword}@db.example.invalid:5432/postgres`,
  LOCAL_DATABASE_PASSWORD: localPassword,
  REMOTE_DATABASE_PASSWORD: remotePassword,
};

const publicMarker = fixture('public_publishable_key');

const buildEnv = {
  PATH: process.env.PATH ?? '',
  HOME: process.env.HOME ?? '',
  TMPDIR: process.env.TMPDIR ?? '/tmp',
  CI: 'true',
  NX_DAEMON: 'false',
  NX_ISOLATE_PLUGINS: 'false',
  NG_APP_SUPABASE_URL: 'https://public-test.example.invalid',
  NG_APP_SUPABASE_PUBLISHABLE_KEY: publicMarker,
  NG_APP_SUPABASE_FUNCTIONS_URL:
    'https://public-test.example.invalid/functions/v1',
  ...forbiddenValues,
};

const build = spawnSync(
  process.execPath,
  [
    resolve(root, 'node_modules/nx/dist/bin/nx.js'),
    'build',
    'tickist-web',
    '--configuration',
    'production',
    '--skip-nx-cache',
  ],
  {
    cwd: root,
    env: buildEnv,
    encoding: 'utf8',
    timeout: 300_000,
    maxBuffer: 4 * 1024 * 1024,
  }
);

if (build.status !== 0) {
  console.error(
    `Synthetic browser build failed (exit ${build.status ?? 'none'}, signal ${
      build.signal ?? 'none'
    }, error ${
      build.error?.code ?? 'none'
    }). Build output withheld to avoid printing environment values.`
  );
  process.exit(1);
}

const artifacts = resolve(root, 'dist/tickist-web');

const result = await scanBrowserArtifacts(artifacts, forbiddenValues);

if (result.findings.length) {
  for (const finding of result.findings) {
    console.error(
      `Private fixture ${finding.name} appeared in ${finding.file}.`
    );
  }

  process.exit(1);
}

const publicResult = await scanBrowserArtifacts(artifacts, {
  PUBLIC_PUBLISHABLE_KEY: publicMarker,
});

if (!publicResult.findings.length) {
  console.error('Public configuration was not included in the browser build.');
  process.exit(1);
}

console.log(
  `Browser artifact leak check passed for ${result.filesScanned} files.`
);
