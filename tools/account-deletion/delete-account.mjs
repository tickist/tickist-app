#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { pathToFileURL } from 'node:url';

class OperatorError extends Error {}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function parseOptions(argv) {
  const options = { apply: false, help: false };
  const seen = new Set();
  for (const arg of argv) {
    const [key, ...parts] = arg.split('=');
    if (seen.has(key)) throw new OperatorError('Duplicate option.');
    seen.add(key);
    const value = parts.join('=');
    if (key === '--apply' && !parts.length) options.apply = true;
    else if (key === '--help' && !parts.length) options.help = true;
    else if (key === '--user-id' && UUID.test(value)) options.userId = value;
    else if (key === '--confirm-user-id' && UUID.test(value))
      options.confirmUserId = value;
    else if (key === '--confirm-project' && /^[a-z0-9-]+$/.test(value))
      options.confirmProject = value;
    else throw new OperatorError('Invalid option. Use --help.');
  }
  if (!options.help && !options.userId)
    throw new OperatorError('--user-id=<uuid> is required.');
  if (options.apply && options.confirmUserId !== options.userId) {
    throw new OperatorError(
      '--apply requires --confirm-user-id matching --user-id.'
    );
  }
  return options;
}

export function resolveTarget(env, options) {
  const raw = env.NG_APP_SUPABASE_URL ?? env.SUPABASE_URL;
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new OperatorError('Supabase API origin is required.');
  }
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  ) {
    throw new OperatorError('Use an exact Supabase API origin.');
  }
  const local =
    ['localhost', '127.0.0.1'].includes(url.hostname) &&
    url.protocol === 'http:' &&
    url.port === '54321';
  const match = url.hostname.match(/^([a-z0-9]+)\.supabase\.co$/);
  if (!local && (!match || url.protocol !== 'https:' || url.port)) {
    throw new OperatorError('Unsupported Supabase origin.');
  }
  const project = local ? 'local' : match[1];
  if (!local && env.SUPABASE_PROJECT_REF !== project) {
    throw new OperatorError('SUPABASE_PROJECT_REF must match the API origin.');
  }
  if (options.apply && options.confirmProject !== project) {
    throw new OperatorError(
      '--apply requires --confirm-project matching the API target.'
    );
  }
  const key = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key)
    throw new OperatorError('A server-side Supabase secret is required.');
  return { url: url.origin, key, project };
}

function assertPreview(data, userId) {
  if (
    !data ||
    data.user_id !== userId ||
    !Array.isArray(data.blockers) ||
    !data.blockers.every((item) => typeof item === 'string') ||
    !Array.isArray(data.storage) ||
    !data.counts ||
    Object.values(data.counts).some((n) => !Number.isSafeInteger(n) || n < 0)
  ) {
    throw new OperatorError('Invalid deletion preview; no deletion attempted.');
  }
  for (const file of data.storage) {
    if (
      file.bucket !== 'avatars' ||
      typeof file.name !== 'string' ||
      !file.name.startsWith(`${userId}/`) ||
      file.name.split('/').some((part) => ['.', '..', ''].includes(part))
    ) {
      throw new OperatorError(
        'Unexpected storage path; manual review required.'
      );
    }
  }
  return data;
}

export async function deleteAccount(client, options, report = () => {}) {
  if (!UUID.test(options.userId ?? ''))
    throw new OperatorError('Invalid user ID.');
  if (options.apply && options.confirmUserId !== options.userId)
    throw new OperatorError('User confirmation mismatch.');
  const inspect = async () => {
    const { data, error } = await client.rpc('account_deletion_preview', {
      p_user_id: options.userId,
    });
    if (error)
      throw new OperatorError(
        'Account inspection failed. Check migration 0024 and the selected account.'
      );
    return assertPreview(data, options.userId);
  };
  const preview = await inspect();
  // Counts and blocker codes only: never print email, task content or credentials.
  report({ counts: preview.counts, blockers: preview.blockers });
  if (!options.apply) return { status: 'preview', blockers: preview.blockers };
  if (preview.blockers.length)
    throw new OperatorError(
      'Deletion blocked; resolve the preview blockers first.'
    );

  // Re-check after the preview before any mutation. The Auth trigger also checks
  // inside the deletion transaction, so a new collaborator never gets deleted.
  const current = await inspect();
  if (current.blockers.length)
    throw new OperatorError('Account changed; deletion blocked.');
  for (let offset = 0; offset < current.storage.length; offset += 100) {
    const names = current.storage
      .slice(offset, offset + 100)
      .map((file) => file.name);
    const { error } = await client.storage.from('avatars').remove(names);
    if (error)
      throw new OperatorError(
        'Avatar cleanup failed. Account was not deleted; some avatars may already be removed. Reinspect before retrying.'
      );
  }
  const remaining = await inspect();
  if (remaining.blockers.length || remaining.storage.length) {
    throw new OperatorError(
      'Final inspection blocked deletion. Avatars may already be removed. Reinspect before retrying.'
    );
  }
  const { error } = await client.auth.admin.deleteUser(options.userId, false);
  if (error)
    throw new OperatorError(
      'Auth deletion failed. Account may remain; avatars may already be removed. Reinspect before retrying.'
    );
  const check = await client.auth.admin.getUserById(options.userId);
  if (!check.error || check.error.code !== 'user_not_found') {
    throw new OperatorError(
      'Deletion response received, but account absence could not be verified. Do not report completion yet.'
    );
  }
  return { status: 'deleted' };
}

export async function main(argv = process.argv.slice(2), env = process.env) {
  const options = parseOptions(argv);
  if (options.help) {
    console.log(`Tickist operator account deletion (read-only preview by default).
Load the intended environment with dotenv; never pass credentials as arguments.
  --user-id=<uuid>
  --apply --confirm-user-id=<same-uuid> --confirm-project=<project-ref|local>
Verify the requester and review sharing, sent email, backups and external logs first.
This tool does not delete backups or email already delivered to mailboxes.`);
    return;
  }
  const target = resolveTarget(env, options);
  const client = createClient(target.url, target.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  console.log(
    `Target: ${target.project}; mode: ${
      options.apply ? 'APPLY' : 'read-only preview'
    }`
  );
  const result = await deleteAccount(client, options, (summary) =>
    console.log(JSON.stringify(summary))
  );
  console.log(
    result.status === 'deleted'
      ? 'Live Auth account deletion verified. Complete the documented backup, mailbox and provider-log follow-up.'
      : 'Preview only: no changes made.'
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    // Unexpected provider/network errors can contain URLs or credentials.
    console.error(
      error instanceof OperatorError
        ? error.message
        : 'Unexpected provider failure. Account deletion may be incomplete; reinspect before retrying.'
    );
    process.exitCode = 1;
  });
}
