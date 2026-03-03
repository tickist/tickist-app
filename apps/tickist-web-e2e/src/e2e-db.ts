import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { workspaceRoot } from '@nx/devkit';

type ResetPhase = 'setup' | 'teardown';
const DEFAULT_RESET_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 5000;

export async function resetDatabase(phase: ResetPhase): Promise<void> {
  const envFile = resolveEnvFile();
  const dbUrl =
    process.env['SUPABASE_E2E_DB_URL'] ??
    (envFile ? readEnvValue(envFile, 'SUPABASE_E2E_DB_URL') : null);

  if (!dbUrl) {
    throw new Error(
      `Missing SUPABASE_E2E_DB_URL for e2e ${phase}. Set SUPABASE_E2E_DB_URL or provide an env file via E2E_ENV_FILE (for example .env.e2e or .local_env.e2e).`
    );
  }

  const localDbUrl =
    process.env['SUPABASE_DB_URL'] ??
    (envFile ? readEnvValue(envFile, 'SUPABASE_DB_URL') : null);
  if (localDbUrl && areSameDatabaseUrl(dbUrl, localDbUrl)) {
    throw new Error(
      'Refusing to reset database: SUPABASE_E2E_DB_URL points to SUPABASE_DB_URL. Use a dedicated test database/branch for e2e.'
    );
  }

  const remoteDbUrl =
    process.env['SUPABASE_REMOTE_DB_URL'] ??
    (envFile ? readEnvValue(envFile, 'SUPABASE_REMOTE_DB_URL') : null);
  if (remoteDbUrl && areSameDatabaseUrl(dbUrl, remoteDbUrl)) {
    throw new Error(
      'Refusing to reset database: SUPABASE_E2E_DB_URL points to SUPABASE_REMOTE_DB_URL. E2E cannot target production/staging shared database.'
    );
  }

  await resetDatabaseWithRetry(dbUrl, phase);
}

export async function ensureE2EAuthUser(): Promise<void> {
  const envFile = resolveEnvFile();
  const supabaseUrl =
    readFirstAvailableEnvValue(
      ['NG_APP_SUPABASE_URL', 'SUPABASE_URL', 'API_URL'],
      envFile
    ) ?? 'http://127.0.0.1:54321';
  const publishableKey = readFirstAvailableEnvValue(
    [
      'NG_APP_SUPABASE_PUBLISHABLE_KEY',
      'NG_APP_SUPABASE_ANON_KEY',
      'SUPABASE_PUBLISHABLE_KEY',
      'SUPABASE_ANON_KEY',
      'PUBLISHABLE_KEY',
      'ANON_KEY',
    ],
    envFile
  );

  if (!publishableKey) {
    throw new Error(
      `Missing Supabase publishable/anon key for e2e auth bootstrap. Checked keys: NG_APP_SUPABASE_PUBLISHABLE_KEY, NG_APP_SUPABASE_ANON_KEY, SUPABASE_PUBLISHABLE_KEY, SUPABASE_ANON_KEY, PUBLISHABLE_KEY, ANON_KEY${envFile ? ` (env file: ${envFile})` : ''}.`
    );
  }

  const email = process.env['E2E_AUTH_EMAIL'] ?? 'e2e-shared-user@tickist.dev';
  const password = process.env['E2E_AUTH_PASSWORD'] ?? 'Test1234!';
  const baseUrl = supabaseUrl.replace(/\/+$/, '');

  const signInAttempt = await callAuthTokenEndpoint(
    baseUrl,
    publishableKey,
    email,
    password
  );
  if (signInAttempt.ok) {
    return;
  }

  const signUp = await fetch(`${baseUrl}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
    },
    body: JSON.stringify({ email, password }),
  });
  const signUpText = await signUp.text();
  if (
    !signUp.ok &&
    !signUpText.toLowerCase().includes('already registered')
  ) {
    throw new Error(
      `[e2e-db] Failed to create e2e auth user (${signUp.status}): ${truncateForLog(signUpText)}`
    );
  }

  const postSignUpSignIn = await callAuthTokenEndpoint(
    baseUrl,
    publishableKey,
    email,
    password
  );
  if (!postSignUpSignIn.ok) {
    throw new Error(
      `[e2e-db] Failed to sign in e2e auth user after signup (${postSignUpSignIn.status}): ${truncateForLog(postSignUpSignIn.body)}`
    );
  }
}

async function resetDatabaseWithRetry(
  dbUrl: string,
  phase: ResetPhase
): Promise<void> {
  const attempts = resolveResetAttempts();
  const resetArgs = resolveResetArgs(dbUrl);
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await runCommand('npx', ['supabase', 'db', 'reset', ...resetArgs]);
      return;
    } catch (error) {
      lastError = toError(error);
      if (attempt >= attempts) {
        break;
      }

      const delayMs = RETRY_BASE_DELAY_MS * attempt;
      console.warn(
        `[e2e-db] supabase db reset failed during ${phase} (attempt ${attempt}/${attempts}): ${lastError.message}`
      );
      console.warn(`[e2e-db] retrying in ${delayMs}ms...`);
      await wait(delayMs);
    }
  }

  throw new Error(
    `[e2e-db] Failed to reset database during ${phase} after ${attempts} attempts. Last error: ${
      lastError?.message ?? 'Unknown error'
    }`
  );
}

function resolveResetAttempts(): number {
  const fromEnv = Number(process.env['E2E_DB_RESET_ATTEMPTS'] ?? '');
  if (Number.isInteger(fromEnv) && fromEnv > 0) {
    return fromEnv;
  }
  return DEFAULT_RESET_ATTEMPTS;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolvePromise) => {
    setTimeout(resolvePromise, ms);
  });
}

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}

function areSameDatabaseUrl(left: string, right: string): boolean {
  return normalizeDatabaseUrl(left) === normalizeDatabaseUrl(right);
}

function resolveResetArgs(dbUrl: string): string[] {
  // For local Supabase stack, use the native local reset path.
  // The --db-url path is more prone to transient upstream 502 errors in CI.
  if (isLocalDatabaseUrl(dbUrl)) {
    return [];
  }
  return ['--db-url', dbUrl];
}

function isLocalDatabaseUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    const hostname = parsed.hostname.toLowerCase();
    return hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '::1';
  } catch {
    return false;
  }
}

function normalizeDatabaseUrl(raw: string): string {
  const trimmed = raw.trim();
  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.toLowerCase();
    const hostname = parsed.hostname.toLowerCase();
    const port = parsed.port || defaultPort(protocol);
    const pathname = parsed.pathname || '/';
    return `${protocol}//${hostname}:${port}${pathname}`;
  } catch {
    return trimmed;
  }
}

function defaultPort(protocol: string): string {
  if (protocol === 'postgresql:' || protocol === 'postgres:') {
    return '5432';
  }
  return '';
}

function readEnvValue(file: string, key: string): string | null {
  const fullPath = resolve(workspaceRoot, file);
  const content = readFileSync(fullPath, 'utf-8');
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const separator = trimmed.indexOf('=');
    if (separator === -1) {
      continue;
    }
    const name = trimmed.slice(0, separator).trim();
    if (name !== key) {
      continue;
    }
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    return value;
  }
  return null;
}

function resolveEnvFile(): string | null {
  const explicit = process.env['E2E_ENV_FILE'];
  if (explicit) {
    return explicit;
  }

  const candidates = ['.env.e2e', '.local_env.e2e'];
  for (const file of candidates) {
    if (existsSync(resolve(workspaceRoot, file))) {
      return file;
    }
  }

  return null;
}

function readFirstAvailableEnvValue(
  keys: readonly string[],
  envFile: string | null
): string | null {
  for (const key of keys) {
    const fromProcess = process.env[key];
    if (fromProcess) {
      return fromProcess;
    }
  }

  if (!envFile) {
    return null;
  }

  for (const key of keys) {
    const fromFile = readEnvValue(envFile, key);
    if (fromFile) {
      return fromFile;
    }
  }

  return null;
}

function runCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: workspaceRoot,
      stdio: 'inherit',
      shell: false,
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
      }
    });
  });
}

async function callAuthTokenEndpoint(
  baseUrl: string,
  publishableKey: string,
  email: string,
  password: string
): Promise<{ ok: boolean; status: number; body: string }> {
  const response = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
    },
    body: JSON.stringify({ email, password }),
  });
  const body = await response.text();
  return {
    ok: response.ok,
    status: response.status,
    body,
  };
}

function truncateForLog(value: string, max = 300): string {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max)}...`;
}
