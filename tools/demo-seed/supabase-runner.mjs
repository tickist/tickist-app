import { createClient } from '@supabase/supabase-js';
import { DATASET_VERSION, DEMO_SEED_ID, DEMO_USER } from './fixtures.mjs';
import {
  generateDemoDataset,
  summarizeDataset,
  validateDataset,
} from './generator.mjs';
import { isMarkedDemoUser } from './safety.mjs';

function marker() {
  return {
    data_role: 'demo',
    demo_seed_id: DEMO_SEED_ID,
    demo_seed_locale: 'en',
    demo_seed_version: DATASET_VERSION,
  };
}

function userMetadata() {
  return {
    username: DEMO_USER.username,
    full_name: DEMO_USER.fullName,
    language: 'en',
    timezone: DEMO_USER.timezone,
    city: DEMO_USER.city,
  };
}

function failOnError(error, context) {
  if (error) throw new Error(`${context}: ${error.message}`);
}

async function listAllUsers(client) {
  const result = [];
  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    failOnError(error, 'Could not list Auth users');
    result.push(...data.users);
    if (data.users.length < 1000) return result;
  }
  throw new Error('Auth user scan exceeded the safety pagination limit.');
}

async function findUser(client) {
  const users = await listAllUsers(client);
  return (
    users.find(
      (user) => user.email?.toLowerCase() === DEMO_USER.email.toLowerCase()
    ) ?? null
  );
}

async function createDemoUser(client, password) {
  if (!password) {
    throw new Error(
      'DEMO_SEED_INITIAL_PASSWORD is required when creating the demo account.'
    );
  }
  const { data, error } = await client.auth.admin.createUser({
    email: DEMO_USER.email,
    password,
    email_confirm: true,
    user_metadata: userMetadata(),
    app_metadata: marker(),
  });
  failOnError(error, `Could not create ${DEMO_USER.email}`);
  if (!data.user?.id) {
    throw new Error(`Auth did not return an ID for ${DEMO_USER.email}.`);
  }
  return data.user;
}

async function resolveDemoUser(client, mode, password) {
  const existing = await findUser(client);
  if (existing && !isMarkedDemoUser(existing)) {
    throw new Error(
      `Safety stop: ${DEMO_USER.email} exists without the expected demo marker.`
    );
  }
  if (mode === 'replace' && existing) {
    const { error } = await client.auth.admin.deleteUser(existing.id, false);
    failOnError(error, `Could not replace ${DEMO_USER.email}`);
    return createDemoUser(client, password);
  }
  return existing ?? createDemoUser(client, password);
}

async function insertRows(client, table, rows) {
  for (let index = 0; index < rows.length; index += 400) {
    const { error } = await client
      .from(table)
      .insert(rows.slice(index, index + 400));
    failOnError(error, `Could not insert ${table}`);
  }
}

async function deleteWhere(client, table, column, ownerId) {
  const { error } = await client.from(table).delete().eq(column, ownerId);
  failOnError(error, `Could not clear ${table}`);
}

async function findInboxProjectId(client, ownerId) {
  const { data, error } = await client
    .from('projects')
    .select('id')
    .eq('owner_id', ownerId)
    .eq('is_inbox', true)
    .maybeSingle();
  failOnError(error, 'Could not resolve the demo Inbox');
  return data?.id ?? undefined;
}

async function clearDomainData(client, ownerId) {
  await deleteWhere(client, 'task_reminders', 'owner_id', ownerId);
  await deleteWhere(client, 'routine_reminders', 'owner_id', ownerId);
  await deleteWhere(client, 'tasks', 'owner_id', ownerId);
  await deleteWhere(client, 'notifications', 'recipient_id', ownerId);
  await deleteWhere(client, 'notification_preferences', 'user_id', ownerId);
  await deleteWhere(client, 'tags', 'owner_id', ownerId);
  const { error: projectError } = await client
    .from('projects')
    .delete()
    .eq('owner_id', ownerId)
    .eq('is_inbox', false);
  failOnError(projectError, 'Could not clear projects');
}

async function writeProfileAndInbox(client, dataset) {
  const inbox = dataset.projects.find((project) => project.is_inbox);
  if (!inbox) throw new Error('Generated dataset does not contain an Inbox.');
  const { error: inboxError } = await client
    .from('projects')
    .upsert(inbox, { onConflict: 'id' });
  failOnError(inboxError, 'Could not write the demo Inbox');
  const { error: profileError } = await client
    .from('app_users')
    .upsert(dataset.profile, { onConflict: 'auth_user_id' });
  failOnError(profileError, 'Could not write the demo app user');
}

async function writeDataset(client, dataset) {
  await clearDomainData(client, dataset.profile.auth_user_id);
  await writeProfileAndInbox(client, dataset);
  await insertRows(
    client,
    'projects',
    dataset.projects.filter((project) => !project.is_inbox)
  );
  await insertRows(client, 'tags', dataset.tags);
  await insertRows(client, 'tasks', dataset.tasks);
  await insertRows(client, 'task_tags', dataset.taskTags);
  await insertRows(client, 'task_assignees', dataset.taskAssignees);
  await insertRows(client, 'task_steps', dataset.taskSteps);
  await insertRows(client, 'task_reminders', dataset.taskReminders);
  await insertRows(client, 'notifications', dataset.notifications);
}

async function verifyCount(client, table, column, ownerId, expected) {
  const { count, error } = await client
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq(column, ownerId);
  failOnError(error, `Could not verify ${table}`);
  if (count !== expected) {
    throw new Error(
      `Verification failed for ${table}: expected ${expected}, got ${count}.`
    );
  }
}

async function verifyDataset(client, dataset) {
  const ownerId = dataset.profile.auth_user_id;
  await verifyCount(client, 'projects', 'owner_id', ownerId, 30);
  await verifyCount(client, 'tasks', 'owner_id', ownerId, 200);
  await verifyCount(client, 'tags', 'owner_id', ownerId, dataset.tags.length);
  await verifyCount(
    client,
    'task_reminders',
    'owner_id',
    ownerId,
    dataset.taskReminders.length
  );
  const { count, error } = await client
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', ownerId)
    .eq('is_done', true);
  failOnError(error, 'Could not verify completed tasks');
  if (count !== 40) {
    throw new Error(
      `Verification failed for completed tasks: expected 40, got ${count}.`
    );
  }
}

export function createAdminClient(url, serviceRoleKey) {
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export async function applyDemoSeed({
  url,
  serviceRoleKey,
  password,
  mode,
  log = console.log,
}) {
  const client = createAdminClient(url, serviceRoleKey);
  const user = await resolveDemoUser(client, mode, password);
  const existingInboxId = await findInboxProjectId(client, user.id);
  const dataset = generateDemoDataset(user.id, existingInboxId);
  validateDataset(dataset);
  await writeDataset(client, dataset);
  const { error: metadataError } = await client.auth.admin.updateUserById(
    user.id,
    {
      user_metadata: userMetadata(),
      app_metadata: marker(),
    }
  );
  failOnError(metadataError, `Could not update markers for ${DEMO_USER.email}`);
  await verifyDataset(client, dataset);
  const summary = summarizeDataset(dataset);
  log(
    `Seeded ${DEMO_USER.email}: ${summary.projects} projects, ${summary.tasks} tasks, ${summary.completedTasks} completed, checksum ${summary.checksum}.`
  );
  return summary;
}
