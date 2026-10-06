import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { scanBrowserArtifacts } from './browser-artifacts.mjs';

test('scans dynamic chunks and source maps without returning secret values', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'tickist-artifacts-'));

  try {
    await mkdir(join(directory, 'assets', 'chunks'), { recursive: true });
    await writeFile(join(directory, 'index.html'), '<html></html>');
    await writeFile(join(directory, 'assets', 'chunks', 'lazy.js'), 'fake-aws');
    await writeFile(
      join(directory, 'assets', 'chunks', 'lazy.js.map'),
      'fake-database-password'
    );

    const result = await scanBrowserArtifacts(directory, {
      AWS_SECRET_ACCESS_KEY: 'fake-aws',
      DATABASE_PASSWORD: 'fake-database-password',
    });

    assert.equal(result.filesScanned, 3);
    assert.deepEqual(result.findings, [
      { name: 'AWS_SECRET_ACCESS_KEY', file: 'assets/chunks/lazy.js' },
      { name: 'DATABASE_PASSWORD', file: 'assets/chunks/lazy.js.map' },
    ]);
    assert.equal(
      JSON.stringify(result).includes('fake-database-password'),
      false
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('detects encoded secret values in generated files', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'tickist-encoded-artifacts-'));
  const secret = 'fake:private/value';

  try {
    await writeFile(
      join(directory, 'lazy.js.map'),
      Buffer.from(secret).toString('base64')
    );

    const result = await scanBrowserArtifacts(directory, { PRIVATE: secret });

    assert.deepEqual(result.findings, [
      { name: 'PRIVATE_BASE64', file: 'lazy.js.map' },
    ]);
    assert.equal(JSON.stringify(result).includes(secret), false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
