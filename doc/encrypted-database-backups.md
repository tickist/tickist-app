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

Never test a restore against production. Keep an encrypted copy off the machine creating backups and perform an isolated recovery drill at least quarterly. Retention deletion is intentionally not automated.
