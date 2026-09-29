const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(
  'supabase/functions/project-invite/index.ts',
  'utf8'
);
const code = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

async function requestInvitation(existing) {
  let handler;
  const calls = { upserts: 0, notifications: 0, emails: [] };
  const client = {
    auth: {
      getUser: async () => ({ data: { user: { id: 'owner' } } }),
      admin: {
        listUsers: async () => ({
          data: {
            users: [{ id: 'recipient', email: 'recipient@example.invalid' }],
          },
        }),
      },
    },
    from(table) {
      const chain = {
        select() {
          return chain;
        },
        eq() {
          return chain;
        },
        maybeSingle: async () => ({
          data:
            table === 'projects'
              ? { id: 'project', owner_id: 'owner', name: 'Fixture' }
              : existing,
        }),
        upsert() {
          calls.upserts++;
          return chain;
        },
        single: async () => ({ data: { invitation_id: 'new-generation' } }),
        insert: async () => {
          calls.notifications++;
          return {};
        },
      };
      return chain;
    },
    rpc: async (_name, args) => {
      calls.emails.push(args);
      return {};
    },
  };
  vm.runInNewContext(code, {
    exports: {},
    console,
    Request,
    Response,
    Date,
    crypto: require('node:crypto').webcrypto,
    require(name) {
      if (name.includes('http/server'))
        return {
          serve: (fn) => {
            handler = fn;
          },
        };
      if (name.includes('supabase-js')) return { createClient: () => client };
      if (name.includes('common'))
        return {
          asOptionalString: (s) =>
            typeof s === 'string' && s.trim() ? s.trim() : null,
          getBearerToken: () => 'fixture-token',
          requireEnv: () => 'fixture',
          requireSupabaseSecretKey: () => 'fixture',
        };
      throw new Error('Unexpected import: ' + name);
    },
  });
  const response = await handler(
    new Request('https://example.invalid/invite', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'project',
        email: 'recipient@example.invalid',
      }),
    })
  );
  return { status: response.status, body: await response.json(), calls };
}

test('current pending invitation does not resend or extend its lifetime', async () => {
  const r = await requestInvitation({
    status: 'pending',
    invited_at: new Date().toISOString(),
  });
  assert.equal(r.body.code, 'already_pending');
  assert.equal(r.calls.upserts, 0);
  assert.equal(r.calls.notifications, 0);
  assert.equal(r.calls.emails.length, 0);
});
test('expired invitation uses the new database generation for deduplication', async () => {
  const r = await requestInvitation({
    status: 'pending',
    invited_at: new Date(Date.now() - 31 * 86400000).toISOString(),
  });
  assert.equal(r.status, 200);
  assert.equal(r.body.code, 'invited');
  assert.equal(r.calls.upserts, 1);
  assert.equal(
    r.calls.emails[0].p_dedupe_key,
    'project-invite:project:recipient:new-generation'
  );
});
test('accepted membership is not replaced or emailed again', async () => {
  const r = await requestInvitation({ status: 'accepted' });
  assert.equal(r.body.code, 'already_member');
  assert.equal(r.calls.upserts, 0);
  assert.equal(r.calls.emails.length, 0);
});
