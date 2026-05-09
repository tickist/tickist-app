#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const startedAt = Date.now();
  const reportDir = path.resolve(process.cwd(), args.reportDir);
  const connection = resolveSupabaseConnection(args.target);
  const supabase = createClient(connection.url, connection.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const rows = await loadAvatarRows(supabase);
  const summary = {
    mode: args.dryRun ? 'dry-run' : 'write',
    target: args.target,
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: '',
    durationMs: 0,
    scannedRows: rows.length,
    candidates: 0,
    updated: 0,
    unchanged: 0,
    pendingUpdates: 0,
    failed: 0,
  };
  const errors = [];

  for (const row of rows) {
    const avatarUrl = asOptionalString(row.avatar_url);
    if (!avatarUrl) {
      continue;
    }
    summary.candidates += 1;

    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(
      row.auth_user_id
    );
    if (authError || !authData?.user) {
      summary.failed += 1;
      errors.push({
        authUserId: row.auth_user_id,
        reason: 'auth_user_lookup_failed',
        message: authError?.message ?? 'Auth user not found.',
      });
      continue;
    }

    const currentMetadata = asRecord(authData.user.user_metadata);
    const currentAvatarUrl = asOptionalString(currentMetadata['avatar_url']);
    if (currentAvatarUrl === avatarUrl) {
      summary.unchanged += 1;
      continue;
    }

    if (args.dryRun) {
      summary.pendingUpdates += 1;
      continue;
    }

    const nextMetadata = {
      ...currentMetadata,
      avatar_url: avatarUrl,
      avatar_version: new Date().toISOString(),
    };

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      row.auth_user_id,
      {
        user_metadata: nextMetadata,
      }
    );
    if (updateError) {
      summary.failed += 1;
      errors.push({
        authUserId: row.auth_user_id,
        reason: 'auth_user_update_failed',
        message: updateError.message,
      });
      continue;
    }

    summary.updated += 1;
  }

  const finishedAt = Date.now();
  summary.finishedAt = new Date(finishedAt).toISOString();
  summary.durationMs = finishedAt - startedAt;

  await writeReport(reportDir, summary, errors);
  printConsoleSummary(summary, reportDir);
}

function parseArgs(argv) {
  const args = {
    target: 'local',
    dryRun: false,
    reportDir: `reports/firebase-migration/${new Date().toISOString().replace(/[:.]/g, '-')}`,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    switch (token) {
      case '--target':
        args.target = requireValue(argv, ++index, '--target');
        break;
      case '--report-dir':
        args.reportDir = requireValue(argv, ++index, '--report-dir');
        break;
      case '--dry-run':
        args.dryRun = true;
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${token}`);
    }
  }

  return args;
}

function requireValue(argv, index, name) {
  const value = argv[index];
  if (!value) {
    throw new Error(`Missing value for ${name}`);
  }
  return value;
}

function printHelp() {
  console.log(`Backfill avatar metadata from app_users to auth.users

Usage:
  node scripts/firebase-migration/backfill-avatar-metadata.mjs [options]

Options:
  --target <local|remote>    Target environment, default: local.
  --dry-run                  Build summary only, no writes to auth metadata.
  --report-dir <dir>         Output directory for reports.
  --help                     Print this help.

Environment:
  NG_APP_SUPABASE_URL        Target Supabase URL.
  SUPABASE_SECRET_KEY        Secret key used by auth admin API.
`);
}

async function loadAvatarRows(supabase) {
  const { data, error } = await supabase
    .from('app_users')
    .select('auth_user_id, avatar_url')
    .not('avatar_url', 'is', null);
  if (error) {
    throw new Error(`Unable to load app_users avatar data: ${error.message}`);
  }
  return (data ?? []).filter(
    (row) =>
      typeof row.auth_user_id === 'string' &&
      row.auth_user_id.trim().length > 0 &&
      typeof row.avatar_url === 'string'
  );
}

function resolveSupabaseConnection(target) {
  const normalizedTarget = String(target).trim().toLowerCase();
  let url = process.env.NG_APP_SUPABASE_URL?.trim();

  if (normalizedTarget === 'local' && !url) {
    url = 'http://127.0.0.1:54321';
  }
  if (!url) {
    throw new Error(`Missing NG_APP_SUPABASE_URL for target "${normalizedTarget}".`);
  }

  const serviceRoleKey =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SECRET_KEY.');
  }

  return { url, serviceRoleKey };
}

async function writeReport(reportDir, summary, errors) {
  await fs.mkdir(reportDir, { recursive: true });
  const summaryPath = path.join(reportDir, 'avatar-backfill-summary.json');
  const errorsPath = path.join(reportDir, 'avatar-backfill-errors.json');
  await fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  await fs.writeFile(errorsPath, `${JSON.stringify(errors, null, 2)}\n`, 'utf8');
}

function printConsoleSummary(summary, reportDir) {
  console.log('Avatar metadata backfill finished.');
  console.log(
    JSON.stringify(
      {
        mode: summary.mode,
        target: summary.target,
        scannedRows: summary.scannedRows,
        candidates: summary.candidates,
        updated: summary.updated,
        unchanged: summary.unchanged,
        pendingUpdates: summary.pendingUpdates,
        failed: summary.failed,
        reportDir,
      },
      null,
      2
    )
  );
}

function asOptionalString(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function asRecord(value) {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value;
  }
  return {};
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
