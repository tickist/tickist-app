import { DEMO_SEED_ID, DEMO_USER } from './fixtures.mjs';

const VALID_MODES = new Set(['sync', 'replace']);

function firstNonEmpty(environment, names) {
  return names
    .map((name) => environment[name])
    .find((value) => typeof value === 'string' && value.trim());
}

export function resolveDemoSeedEnvironment(environment = process.env) {
  return {
    url: firstNonEmpty(environment, [
      'DEMO_SEED_SUPABASE_URL',
      'SUPABASE_URL',
      'NG_APP_SUPABASE_URL',
    ]),
    serviceRoleKey: firstNonEmpty(environment, [
      'DEMO_SEED_SERVICE_ROLE_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_SECRET_KEY',
      'SB_SECRET_KEY',
    ]),
    projectRef: firstNonEmpty(environment, [
      'DEMO_SEED_PROJECT_REF',
      'SUPABASE_PROJECT_REF',
    ]),
    password: firstNonEmpty(environment, ['DEMO_SEED_INITIAL_PASSWORD']),
  };
}

export function parseArgs(argv) {
  const options = {
    apply: false,
    allowRemote: false,
    confirmProjectRef: null,
    confirmReplace: null,
    mode: 'sync',
    help: false,
  };
  for (const argument of argv) {
    if (argument === '--apply') options.apply = true;
    else if (argument === '--allow-remote') options.allowRemote = true;
    else if (argument === '--help' || argument === '-h') options.help = true;
    else if (argument.startsWith('--confirm-project-ref=')) {
      options.confirmProjectRef = argument.split('=', 2)[1];
    } else if (argument.startsWith('--confirm-replace=')) {
      options.confirmReplace = argument.split('=', 2)[1];
    } else if (argument.startsWith('--mode=')) {
      options.mode = argument.split('=', 2)[1];
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  if (!VALID_MODES.has(options.mode)) {
    throw new Error(`Invalid mode "${options.mode}". Use sync or replace.`);
  }
  return options;
}

export function resolveProjectTarget(urlValue) {
  const url = new URL(urlValue);
  const localHosts = new Set(['127.0.0.1', 'localhost']);
  if (
    localHosts.has(url.hostname) &&
    url.protocol === 'http:' &&
    url.port === '54321' &&
    url.pathname === '/' &&
    !url.search &&
    !url.hash &&
    !url.username &&
    !url.password
  ) {
    return { isRemote: false, projectRef: 'local' };
  }
  const match = url.hostname.match(/^([a-z0-9-]+)\.supabase\.co$/i);
  if (!match) {
    throw new Error(
      'Remote demo seed URL must be an exact https://<project-ref>.supabase.co URL.'
    );
  }
  if (url.protocol !== 'https:') {
    throw new Error('Remote demo seed URL must use HTTPS.');
  }
  if (
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    url.username ||
    url.password ||
    url.port
  ) {
    throw new Error(
      'Remote demo seed URL must contain only the exact Supabase project origin.'
    );
  }
  return { isRemote: true, projectRef: match[1] };
}

export function assertExecutionAllowed(options, target, configuredProjectRef) {
  if (!options.apply) return;
  if (target.isRemote) {
    if (!options.allowRemote) {
      throw new Error('Remote writes require --allow-remote.');
    }
    if (!configuredProjectRef) {
      throw new Error(
        'Remote writes require DEMO_SEED_PROJECT_REF or SUPABASE_PROJECT_REF.'
      );
    }
    if (configuredProjectRef !== target.projectRef) {
      throw new Error(
        'The configured project reference does not match the Supabase URL.'
      );
    }
    if (options.confirmProjectRef !== target.projectRef) {
      throw new Error(
        `Remote writes require --confirm-project-ref=${target.projectRef}.`
      );
    }
  }
  if (
    options.mode === 'replace' &&
    options.confirmReplace !== DEMO_USER.email
  ) {
    throw new Error(`Replace requires --confirm-replace=${DEMO_USER.email}.`);
  }
}

export function isMarkedDemoUser(user) {
  return (
    user?.email?.toLowerCase() === DEMO_USER.email.toLowerCase() &&
    user?.app_metadata?.data_role === 'demo' &&
    user?.app_metadata?.demo_seed_id === DEMO_SEED_ID &&
    user?.app_metadata?.demo_seed_locale === 'en'
  );
}
