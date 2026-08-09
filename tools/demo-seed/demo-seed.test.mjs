import assert from 'node:assert/strict';
import test from 'node:test';
import { DEMO_SEED_ID, DEMO_USER } from './fixtures.mjs';
import {
  generateDemoDataset,
  summarizeDataset,
  validateDataset,
} from './generator.mjs';
import {
  assertExecutionAllowed,
  isMarkedDemoUser,
  parseArgs,
  resolveDemoSeedEnvironment,
  resolveProjectTarget,
} from './safety.mjs';

const OWNER = '10000000-0000-4000-8000-000000000001';

test('English dataset is deterministic and complete', () => {
  const first = generateDemoDataset(OWNER);
  const second = generateDemoDataset(OWNER);
  assert.deepEqual(first, second);
  assert.equal(validateDataset(first), true);
  assert.deepEqual(
    {
      projects: summarizeDataset(first).projects,
      tasks: summarizeDataset(first).tasks,
      completedTasks: summarizeDataset(first).completedTasks,
    },
    { projects: 30, tasks: 200, completedTasks: 40 }
  );
  assert.equal(first.profile.preferences.locale, 'en');
  assert.equal(first.profile.preferences.demo_persona.age, 34);
  assert.equal(
    first.profile.preferences.demo_persona.city,
    'Mountain View, California'
  );
});

test('CLI defaults to a no-write sync dry run', () => {
  assert.deepEqual(parseArgs([]), {
    apply: false,
    allowRemote: false,
    confirmProjectRef: null,
    confirmReplace: null,
    mode: 'sync',
    help: false,
  });
});

test('remote writes require all project confirmations', () => {
  const target = resolveProjectTarget('https://abc123.supabase.co');
  assert.throws(
    () => assertExecutionAllowed(parseArgs(['--apply']), target, 'abc123'),
    /--allow-remote/
  );
  assert.throws(
    () =>
      assertExecutionAllowed(
        parseArgs(['--apply', '--allow-remote']),
        target,
        'abc123'
      ),
    /--confirm-project-ref/
  );
  assert.doesNotThrow(() =>
    assertExecutionAllowed(
      parseArgs(['--apply', '--allow-remote', '--confirm-project-ref=abc123']),
      target,
      'abc123'
    )
  );
});

test('replace requires the exact demo email', () => {
  const target = resolveProjectTarget('http://127.0.0.1:54321');
  assert.throws(
    () =>
      assertExecutionAllowed(parseArgs(['--apply', '--mode=replace']), target),
    /confirm-replace/
  );
  assert.doesNotThrow(() =>
    assertExecutionAllowed(
      parseArgs([
        '--apply',
        '--mode=replace',
        `--confirm-replace=${DEMO_USER.email}`,
      ]),
      target
    )
  );
});

test('user marker requires exact email and metadata', () => {
  const user = {
    email: DEMO_USER.email,
    app_metadata: {
      data_role: 'demo',
      demo_seed_id: DEMO_SEED_ID,
      demo_seed_locale: 'en',
    },
  };
  assert.equal(isMarkedDemoUser(user), true);
  assert.equal(
    isMarkedDemoUser({ ...user, email: 'other@example.com' }),
    false
  );
  assert.equal(isMarkedDemoUser({ ...user, app_metadata: {} }), false);
});

test('only the fixed Tickist local origin bypasses remote confirmation', () => {
  assert.deepEqual(resolveProjectTarget('http://127.0.0.1:54321'), {
    isRemote: false,
    projectRef: 'local',
  });
  assert.throws(
    () => resolveProjectTarget('http://127.0.0.1:9999'),
    /exact https/
  );
  assert.throws(
    () => resolveProjectTarget('https://abc123.supabase.co/unexpected'),
    /exact Supabase project origin/
  );
});

test('shared environment names are reused with explicit overrides first', () => {
  assert.deepEqual(
    resolveDemoSeedEnvironment({
      NG_APP_SUPABASE_URL: 'https://shared.supabase.co',
      DEMO_SEED_SUPABASE_URL: 'https://override.supabase.co',
      SUPABASE_SECRET_KEY: 'shared-secret',
      DEMO_SEED_SERVICE_ROLE_KEY: 'override-secret',
      SUPABASE_PROJECT_REF: 'override',
      DEMO_SEED_INITIAL_PASSWORD: 'password',
    }),
    {
      url: 'https://override.supabase.co',
      serviceRoleKey: 'override-secret',
      projectRef: 'override',
      password: 'password',
    }
  );
});
