import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { workspaceRoot } from '@nx/devkit';

type ResetPhase = 'setup' | 'teardown';

export async function resetDatabase(phase: ResetPhase): Promise<void> {
  const envFile = resolveEnvFile();
  const dbUrl =
    process.env['SUPABASE_DB_URL'] ??
    (envFile ? readEnvValue(envFile, 'SUPABASE_DB_URL') : null);

  if (!dbUrl) {
    throw new Error(
      `Missing SUPABASE_DB_URL for e2e ${phase}. Set SUPABASE_DB_URL or provide an env file via E2E_ENV_FILE (for example .env.e2e or .local_env.e2e).`
    );
  }

  await runCommand('npx', ['supabase', 'db', 'reset', '--db-url', dbUrl]);
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
