import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { auditProductionBrowserArtifacts } from './scan-production-browser-artifacts.mjs';

test('production audit detects a database password in a source map without printing it', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'tickist-audit-'));
  const artifacts = join(directory, 'dist', 'tickist-web', 'assets');
  const password = 'fake_database_password_for_audit';

  const env = {
    SUPABASE_REMOTE_DB_URL: `postgresql://postgres:${password}@db.example.invalid:5432/postgres`,
    SUPABASE_SECRET_KEY: 'fake_supabase_secret_for_audit',
    INTERNAL_FUNCTION_SECRET: 'fake_internal_secret_for_audit',
    AWS_SECRET_ACCESS_KEY: 'fake_aws_secret_for_audit',
  };

  try {
    await mkdir(artifacts, { recursive: true });
    await writeFile(join(artifacts, 'lazy.js'), 'export const value = 1;');

    const clean = await auditProductionBrowserArtifacts(
      join(directory, 'dist', 'tickist-web'),
      env
    );

    assert.deepEqual(clean.findings, []);

    await writeFile(join(artifacts, 'lazy.js.map'), password);

    const leaked = await auditProductionBrowserArtifacts(
      join(directory, 'dist', 'tickist-web'),
      env
    );

    assert.deepEqual(leaked.findings, [
      {
        name: 'SUPABASE_REMOTE_DB_URL_PASSWORD_ENCODED',
        file: 'assets/lazy.js.map',
      },
      { name: 'SUPABASE_REMOTE_DB_URL_PASSWORD', file: 'assets/lazy.js.map' },
    ]);
    assert.equal(JSON.stringify(leaked).includes(password), false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
