# Encrypted database backups

Tickist provides a local, encrypted logical backup workflow for Supabase disaster recovery. It reads the selected project and never changes it.

## Included data

Every archive contains application roles, schemas and data, Supabase migration history, explicit Auth schema and data including password hashes, Storage schema and metadata, every physical Storage object, and a manifest with per-file and per-object SHA-256 checksums.

The archive does not contain Supabase platform settings outside Postgres: Edge Function secrets, the project JWT secret, OAuth and SMTP configuration, or Dashboard settings. Keep those separately in a secret manager.

## Encryption and configuration

Archives use authenticated AES-256-GCM encryption with a scrypt-derived key. Copy `.env.backup.example` to ignored `.env.backup.local` and set a random `TICKIST_BACKUP_ENCRYPTION_KEY` of at least 24 characters. Store it in a password manager.

The ignored `.env` supplies:

```text
SUPABASE_REMOTE_DB_URL
NG_APP_SUPABASE_URL
SUPABASE_PROJECT_REF
SUPABASE_SECRET_KEY
```

The script binds the database hostname, API origin, and project reference before reading data. Plain SQL, Auth data, Storage objects, and the tar archive exist only in a permission-restricted temporary directory that is removed on success or failure.

## Create and verify

```bash
npm run db:backup:remote
npm run db:backup:test
```

Successful output contains two ignored files:

```text
backups/tickist-PROJECT_REF-TIMESTAMP.enc
backups/tickist-PROJECT_REF-TIMESTAMP.enc.sha256
```

The command creates the logical dumps, downloads Storage, builds and encrypts the archive, decrypts it again, authenticates it, verifies SQL coverage and every checksum, then reports the final paths.

Verify an existing archive without restoring it:

```bash
npm run db:backup:verify -- \
  --file=backups/tickist-PROJECT_REF-TIMESTAMP.enc
```

## Restore procedure

Restore is intentionally manual because it overwrites authentication and private task data:

1. Select an isolated recovery project and verify the archive.
2. Decrypt and inspect it on an encrypted workstation.
3. Restore roles, application schema and data, and migration history with error-on-first-failure semantics.
4. Restore Auth only after checking target schema compatibility.
5. Restore Storage metadata and upload physical objects through the Storage API or S3 endpoint.
6. Reconfigure JWT, Edge Function, Vault, OAuth, SMTP, scheduler, and Dashboard settings.
7. Invalidate old sessions if the original JWT secret is unavailable.
8. Validate RLS, login, projects, tasks, reminders, notifications, avatars, and account deletion before directing traffic to the recovered project.

Never test a restore against production. Keep an encrypted copy off the machine creating backups and perform an isolated recovery drill at least quarterly. Backup retention uses a separate operator command; no cleanup job is installed automatically.

## Local retention: 30 days

The agreed window is 30 days from creation. `tools/backup/prune.mjs` handles existing canonical archive/checksum pairs for one explicitly selected project, without connecting to Supabase or decrypting private data.

Preview first:

```bash
npm run db:backup:prune -- --project=PROJECT_REF --dir=/absolute/backup/directory
```

The command lists candidates and skipped pairs. It changes nothing. Creation time comes from the UTC timestamp generated in the archive name, not the file modification time; copying an old archive does not restart retention. Do not rename archives or manually alter their dates. Malformed names and other projects are excluded. Expired incomplete pairs, directories and symlinks are reported for manual review rather than deleted.

After reviewing the exact directory, project and candidate list, apply:

```bash
npm run db:backup:prune -- --project=PROJECT_REF \
  --dir=/absolute/backup/directory --apply \
  --confirm-project=PROJECT_REF --confirm-dir=/absolute/backup/directory
```

The confirmations must match the canonical directory and selected project. Apply validates every candidate's encrypted format, checksum and file identity before deleting anything, then checks each pair again before deletion. It removes only `.enc` and its matching `.enc.sha256`; it never recursively deletes a directory. Interrupted cleanup can be partial, so inspect the directory before retrying. At exactly 30 days a pair is eligible; if every backup is expired, every valid selected pair is eligible.

`--dir` defaults to `TICKIST_BACKUP_OUTPUT_DIR` or `backups`; this command does not load environment files itself and needs no database secret or encryption key. Run `npm run db:backup:test` for encryption, project targeting and retention regressions.

This implementation does not make retention operational by itself. Configure a regular local run after reviewing the first preview and confirming the actual backup directory. Monitor failures and review skipped files; until the process runs successfully, do not describe the 30-day maximum as enforced. Creating or verifying a backup does not delete older archives. Copies stored elsewhere, vendor backups, Gmail and deletion reapplication after a restore require separate procedures. No actual backup deletion is performed as part of adding this command.

## Daily user timer

`tools/backup/retention-schedule.mjs` generates a pair of systemd user units for explicit repository, backup directory, project and Node executable paths. It does not install or enable them. Its service invokes the reviewed apply command directly, without a shell or database credentials. The timer runs at 03:50 UTC with up to 15 minutes of randomized delay and catches up after a missed run when the user timer becomes active again.

Generate units in a new review directory using absolute paths:

```js
import { writeRetentionSchedule } from './tools/backup/retention-schedule.mjs';
await writeRetentionSchedule(
  process.cwd(),
  '/tmp/tickist-retention-review',
  '/absolute/backup/directory',
  'PROJECT_REF',
  process.execPath
);
```

Review the generated service's exact project, directory and apply confirmations. Check syntax with `systemd-analyze --user verify` before installing the units in the user's systemd configuration directory and enabling `tickist-backup-retention.timer`. Do not overwrite an existing differently scoped timer. Verify the first service result and the timer's next run.

Use `systemctl --user status tickist-backup-retention.timer` and `journalctl --user -u tickist-backup-retention.service` to monitor operation. Stop and disable the timer before changing the target: `systemctl --user disable --now tickist-backup-retention.timer`. If the repository or Node executable moves, regenerate and verify the service. WSL, a powered-off machine or an inactive user manager can delay cleanup; persistent scheduling is not a guarantee of deletion at the exact 30-day boundary. No system-wide service or linger setting is needed or changed by the generator.
