import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  decryptFile,
  encryptFile,
  sha256File,
  verifyChecksumFile,
} from './archive-crypto.mjs';
import { assertEncryptionKey, resolveProjectTarget } from './backup.mjs';
import { backupStorageObjects } from './storage-backup.mjs';

test('encrypted backup round trip is authenticated', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tickist-crypto-test-'));
  try {
    const input = path.join(root, 'input.bin');
    const encrypted = path.join(root, 'backup.enc');
    const decrypted = path.join(root, 'output.bin');
    const checksum = `${encrypted}.sha256`;
    const password = 'test-only-backup-password-123456';
    const content = Buffer.from('sensitive tickist backup test data');
    await writeFile(input, content);
    await encryptFile(input, encrypted, password);
    await writeFile(checksum, `${await sha256File(encrypted)}  backup.enc\n`);
    await verifyChecksumFile(encrypted, checksum);
    await decryptFile(encrypted, decrypted, password);
    assert.deepEqual(await readFile(decrypted), content);
    await assert.rejects(
      decryptFile(encrypted, path.join(root, 'wrong.bin'), 'wrong-password'),
      /authentication failed/
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('checksum verification rejects a changed archive', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tickist-hash-test-'));
  try {
    const backup = path.join(root, 'backup.enc');
    const checksum = `${backup}.sha256`;
    await writeFile(backup, 'original');
    await writeFile(checksum, `${await sha256File(backup)}  backup.enc\n`);
    await writeFile(backup, 'changed');
    await assert.rejects(
      verifyChecksumFile(backup, checksum),
      /checksum mismatch/
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('storage backup downloads nested objects without trusting paths', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tickist-storage-test-'));
  const files = new Map([
    ['root.png', Buffer.from('root image')],
    ['users/avatar.png', Buffer.from('nested image')],
  ]);
  const fakeClient = {
    storage: {
      listBuckets: async () => ({
        data: [{ id: 'avatars', name: 'avatars', public: true }],
        error: null,
      }),
      from: () => ({
        list: async (prefix) =>
          !prefix
            ? {
                data: [
                  { id: 'root-id', name: 'root.png', metadata: {} },
                  { id: null, name: 'users', metadata: null },
                ],
                error: null,
              }
            : {
                data: [{ id: 'nested-id', name: 'avatar.png', metadata: {} }],
                error: null,
              },
        download: async (name) => ({
          data: new Blob([files.get(name)]),
          error: null,
        }),
      }),
    },
  };
  try {
    const manifest = await backupStorageObjects({
      outputRoot: root,
      client: fakeClient,
      log: () => undefined,
    });
    assert.deepEqual(manifest.objects.map((item) => item.name).sort(), [
      'root.png',
      'users/avatar.png',
    ]);
    for (const object of manifest.objects) {
      assert.deepEqual(
        await readFile(path.join(root, object.archivePath)),
        files.get(object.name)
      );
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('backup target binds API and database credentials to one project', () => {
  assert.deepEqual(
    resolveProjectTarget(
      'https://abc123.supabase.co',
      'postgresql://postgres:password@db.abc123.supabase.co:5432/postgres',
      'abc123'
    ),
    { projectRef: 'abc123', isLocal: false }
  );
  assert.deepEqual(
    resolveProjectTarget(
      'http://127.0.0.1:54321',
      'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
      'local'
    ),
    { projectRef: 'local', isLocal: true }
  );
  assert.throws(
    () =>
      resolveProjectTarget(
        'https://different.supabase.co',
        'postgresql://postgres:password@db.abc123.supabase.co:5432/postgres',
        'abc123'
      ),
    /does not match/
  );
});

test('backup encryption key has a minimum length', () => {
  assert.throws(() => assertEncryptionKey('too-short'), /at least 24/);
  assert.doesNotThrow(() => assertEncryptionKey('long-enough-test-password'));
});
