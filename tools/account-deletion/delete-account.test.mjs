import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  deleteAccount,
  parseOptions,
  resolveTarget,
} from './delete-account.mjs';

const userId = '11111111-1111-4111-8111-111111111111';
const otherId = '22222222-2222-4222-8222-222222222222';
const options = { userId, confirmUserId: userId, apply: true };
const env = {
  NG_APP_SUPABASE_URL: 'https://exampleproject.supabase.co',
  SUPABASE_PROJECT_REF: 'exampleproject',
  SUPABASE_SECRET_KEY: 'test-secret',
};

function fixture(overrides = {}) {
  const calls = [];
  const files = [{ bucket: 'avatars', name: `${userId}/avatar` }];
  let inspections = 0;
  const client = {
    rpc: async () => {
      calls.push('inspect');
      inspections++;
      if (overrides.inspectError) return { error: { message: 'secret' } };
      return {
        data: {
          user_id: userId,
          blockers:
            overrides.blockers ??
            (overrides.changed && inspections > 1
              ? ['shared_work_requires_review']
              : []),
          storage: overrides.files ?? [...files],
          counts: { avatars: files.length, projects: 1, tasks: 2 },
        },
      };
    },
    storage: {
      from: (bucket) => {
        assert.equal(bucket, 'avatars');
        return {
          remove: async (names) => {
            calls.push('storage');
            assert.deepEqual(
              names,
              files.map((file) => file.name)
            );
            if (overrides.storageError) return { error: { message: 'secret' } };
            files.length = 0;
            return { error: null };
          },
        };
      },
    },
    auth: {
      admin: {
        deleteUser: async (id, soft) => {
          calls.push('delete');
          assert.equal(id, userId);
          assert.equal(soft, false);
          return { error: overrides.authError ? { message: 'secret' } : null };
        },
        getUserById: async () => {
          calls.push('verify');
          return overrides.verifyError
            ? { error: { code: 'unexpected_failure' } }
            : { error: { code: 'user_not_found' }, data: { user: null } };
        },
      },
    },
  };
  return { client, calls };
}

test('preview makes no writes even if blockers exist', async () => {
  const { client, calls } = fixture({
    blockers: ['shared_work_requires_review'],
  });
  const result = await deleteAccount(client, { userId, apply: false });
  assert.equal(result.status, 'preview');
  assert.deepEqual(calls, ['inspect']);
});
test('explicit matching user confirmation is required before any API call', async () => {
  const { client, calls } = fixture();
  await assert.rejects(
    deleteAccount(client, { ...options, confirmUserId: otherId }),
    /confirmation/
  );
  assert.deepEqual(calls, []);
  assert.throws(
    () => parseOptions([`--user-id=${userId}`, '--apply']),
    /confirm-user-id/
  );
});
test('CLI rejects unknown and duplicate arguments', () => {
  assert.throws(
    () => parseOptions([`--user-id=${userId}`, `--user-id=${otherId}`]),
    /Duplicate/
  );
  assert.throws(
    () => parseOptions([`--user-id=${userId}`, '--force']),
    /Invalid option/
  );
});
test('remote origin and project confirmation must match before connecting', () => {
  assert.throws(() => resolveTarget(env, options), /confirm-project/);
  assert.throws(
    () =>
      resolveTarget(
        { ...env, SUPABASE_PROJECT_REF: 'other' },
        { ...options, confirmProject: 'exampleproject' }
      ),
    /must match/
  );
  for (const url of [
    'https://evil.example',
    'https://exampleproject.supabase.co/path',
    'https://secret@exampleproject.supabase.co',
    'http://exampleproject.supabase.co',
    'https://exampleproject.supabase.co?key=secret',
  ]) {
    assert.throws(() =>
      resolveTarget(
        { ...env, NG_APP_SUPABASE_URL: url },
        { ...options, confirmProject: 'exampleproject' }
      )
    );
  }
  assert.equal(
    resolveTarget(env, { ...options, confirmProject: 'exampleproject' })
      .project,
    'exampleproject'
  );
  assert.equal(
    resolveTarget(
      { ...env, NG_APP_SUPABASE_URL: 'http://127.0.0.1:54321' },
      { ...options, confirmProject: 'local' }
    ).project,
    'local'
  );
});
test('a blocker prevents all writes', async () => {
  const { client, calls } = fixture({
    blockers: ['shared_work_requires_review'],
  });
  await assert.rejects(deleteAccount(client, options), /blocked/);
  assert.deepEqual(calls, ['inspect']);
});
test('a new collaborator after preview prevents storage deletion', async () => {
  const { client, calls } = fixture({ changed: true });
  await assert.rejects(deleteAccount(client, options), /changed/);
  assert.deepEqual(calls, ['inspect', 'inspect']);
});
test('foreign paths never reach Storage', async () => {
  for (const file of [
    { bucket: 'other', name: `${userId}/avatar` },
    { bucket: 'avatars', name: `${otherId}/avatar` },
    { bucket: 'avatars', name: `${userId}/../avatar` },
  ]) {
    const { client, calls } = fixture({ files: [file] });
    await assert.rejects(deleteAccount(client, options), /storage path/);
    assert.deepEqual(calls, ['inspect']);
  }
});
test('Storage failure leaves Auth intact and reports partial cleanup', async () => {
  const { client, calls } = fixture({ storageError: true });
  await assert.rejects(
    deleteAccount(client, options),
    /some avatars may already be removed/
  );
  assert.ok(!calls.includes('delete'));
});
test('new or unremoved avatars prevent Auth deletion', async () => {
  const { client, calls } = fixture({
    files: [{ bucket: 'avatars', name: `${userId}/avatar` }],
  });
  await assert.rejects(deleteAccount(client, options), /Final inspection/);
  assert.ok(!calls.includes('delete'));
});
test('Auth failure does not report success or leak provider details', async () => {
  const { client, calls } = fixture({ authError: true });
  await assert.rejects(
    deleteAccount(client, options),
    (error) =>
      error.message.includes('Auth deletion failed') &&
      !error.message.includes('secret')
  );
  assert.ok(!calls.includes('verify'));
});
test('unexpected verification failure never counts as absence', async () => {
  const { client } = fixture({ verifyError: true });
  await assert.rejects(deleteAccount(client, options), /could not be verified/);
});
test('hard deletion follows verified Storage cleanup and verifies absence', async () => {
  const { client, calls } = fixture();
  assert.equal((await deleteAccount(client, options)).status, 'deleted');
  assert.deepEqual(calls, [
    'inspect',
    'inspect',
    'storage',
    'inspect',
    'delete',
    'verify',
  ]);
});
