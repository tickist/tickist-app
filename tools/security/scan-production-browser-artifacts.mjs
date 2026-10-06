import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanBrowserArtifacts } from './browser-artifacts.mjs';

const names = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_SESSION_TOKEN',
  'SUPABASE_SECRET_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'INTERNAL_FUNCTION_SECRET',
  'ROUTINE_RUNNER_SECRET',
  'SUPABASE_ACCESS_TOKEN',
  'CLOUDFLARE_API_TOKEN',
  'SUPABASE_DB_URL',
  'SUPABASE_REMOTE_DB_URL',
];

export async function auditProductionBrowserArtifacts(artifacts, env) {
  const forbiddenValues = Object.fromEntries(
    names.flatMap((name) => {
      const value = env[name];

      return value ? [[name, value]] : [];
    })
  );

  for (const name of ['SUPABASE_DB_URL', 'SUPABASE_REMOTE_DB_URL']) {
    const connection = env[name];

    if (!connection) continue;

    let password;

    try {
      password = new URL(connection).password;
    } catch {
      throw new Error(`Cannot audit ${name}: invalid connection URI.`);
    }

    if (!password) {
      throw new Error(`Cannot audit ${name}: missing database password.`);
    }

    forbiddenValues[`${name}_PASSWORD_ENCODED`] = password;
    forbiddenValues[`${name}_PASSWORD`] = decodeURIComponent(password);
  }

  for (const name of [
    'SUPABASE_REMOTE_DB_URL',
    'SUPABASE_SECRET_KEY',
    'INTERNAL_FUNCTION_SECRET',
    'AWS_SECRET_ACCESS_KEY',
  ]) {
    if (!env[name]) {
      throw new Error(`Cannot audit browser artifacts: ${name} is missing.`);
    }
  }

  return scanBrowserArtifacts(artifacts, forbiddenValues);
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const result = await auditProductionBrowserArtifacts(
    resolve('dist/tickist-web'),
    process.env
  );

  if (result.findings.length) {
    for (const finding of result.findings) {
      console.error(
        `Private value ${finding.name} appeared in ${finding.file}.`
      );
    }

    process.exit(1);
  }

  console.log(
    `Production browser artifact audit passed for ${result.filesScanned} files.`
  );
}
