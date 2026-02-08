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

async function resetDatabaseWithRetry(
  dbUrl: string,
  phase: ResetPhase
): Promise<void> {
  const attempts = resolveResetAttempts();
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await runCommand('npx', ['supabase', 'db', 'reset', '--db-url', dbUrl]);
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
