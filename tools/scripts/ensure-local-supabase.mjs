#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const configPath = join(root, 'supabase', 'config.toml');
const config = parseSupabaseConfig(readFileSync(configPath, 'utf8'));
const projectId = config.project_id ?? 'unknown';
const ports = configuredPorts(config);

const status = runSupabase(['status', '--workdir', root], {
  stdio: 'pipe',
});

if (status.status === 0) {
  console.log(`[Supabase] Local project "${projectId}" is already running.`);
  process.exit(0);
}

const blockedPorts = [];
for (const port of ports) {
  if (!(await isPortAvailable(port.value))) {
    blockedPorts.push(port);
  }
}

if (blockedPorts.length) {
  console.error(
    `[Supabase] Cannot start local project "${projectId}" because required ports are already in use.`
  );
  for (const port of blockedPorts) {
    console.error(`  - ${port.value} (${port.key})`);
  }
  console.error('');
  console.error(
    'Another local Supabase project is probably using the same ports. This script will not stop other projects automatically.'
  );
  console.error(
    'Give each app a unique supabase/config.toml project_id and port range, then update its .local_env URLs.'
  );
  process.exit(1);
}

console.log(`[Supabase] Starting local project "${projectId}"...`);
const start = runSupabase(['start', '--workdir', root], { stdio: 'inherit' });
process.exit(start.status ?? 1);

function runSupabase(args, options) {
  return spawnSync('npx', ['supabase', ...args], {
    cwd: root,
    encoding: 'utf8',
    ...options,
  });
}

function isPortAvailable(port) {
  return new Promise((resolvePort) => {
    const server = createServer();
    server.once('error', () => resolvePort(false));
    server.once('listening', () => {
      server.close(() => resolvePort(true));
    });
    server.listen(port, '127.0.0.1');
  });
}

function configuredPorts(parsedConfig) {
  return [
    ['api.port', parsedConfig.api?.port],
    ['db.port', parsedConfig.db?.port],
    ['db.shadow_port', parsedConfig.db?.shadow_port],
    ['db.pooler.port', parsedConfig.db?.pooler?.port],
    ['studio.port', parsedConfig.studio?.port],
    ['inbucket.port', parsedConfig.inbucket?.port],
    ['inbucket.smtp_port', parsedConfig.inbucket?.smtp_port],
    ['inbucket.pop3_port', parsedConfig.inbucket?.pop3_port],
  ]
    .filter((entry) => Number.isInteger(entry[1]))
    .map(([key, value]) => ({ key, value }));
}

function parseSupabaseConfig(source) {
  const result = {};
  let section = result;

  for (const rawLine of source.split(/\r?\n/)) {
    const line = stripComment(rawLine).trim();
    if (!line) {
      continue;
    }

    const sectionMatch = line.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      section = ensureSection(result, sectionMatch[1].split('.'));
      continue;
    }

    const assignment = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.+)$/);
    if (!assignment) {
      continue;
    }

    section[assignment[1]] = parseTomlScalar(assignment[2].trim());
  }

  return result;
}

function ensureSection(target, path) {
  let cursor = target;
  for (const key of path) {
    cursor[key] ??= {};
    cursor = cursor[key];
  }
  return cursor;
}

function parseTomlScalar(value) {
  const stringMatch = value.match(/^"(.*)"$/);
  if (stringMatch) {
    return stringMatch[1];
  }
  if (/^\d+$/.test(value)) {
    return Number(value);
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return value;
}

function stripComment(line) {
  let inString = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index - 1] !== '\\') {
      inString = !inString;
    }
    if (char === '#' && !inString) {
      return line.slice(0, index);
    }
  }
  return line;
}
