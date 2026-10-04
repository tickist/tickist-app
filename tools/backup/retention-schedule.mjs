import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

function unitArgument(value) {
  if (
    !value ||
    [...value].some(
      (character) =>
        character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127
    )
  ) {
    throw new Error('Invalid systemd argument.');
  }

  return `"${value
    .replaceAll('\\', '\\\\')
    .replaceAll('"', '\\"')
    .replaceAll('%', '%%')}"`;
}

export async function writeRetentionSchedule(
  repository,
  output,
  backupDirectory,
  project,
  nodeBinary
) {
  if (!/^[a-z0-9]{1,64}$/.test(project)) {
    throw new Error('Invalid project reference.');
  }

  for (const location of [repository, output, backupDirectory, nodeBinary]) {
    if (!path.isAbsolute(location))
      throw new Error('Schedule paths must be absolute.');
  }

  const command = [
    nodeBinary,
    path.join(repository, 'tools/backup/prune.mjs'),
    `--project=${project}`,
    `--dir=${backupDirectory}`,
    '--apply',
    `--confirm-project=${project}`,
    `--confirm-dir=${backupDirectory}`,
  ]
    .map(unitArgument)
    .join(' ');

  const service = `[Unit]
Description=Tickist local backup retention (30 days)

[Service]
Type=oneshot
ExecStart=${command}
UMask=0077
NoNewPrivileges=true
TimeoutStartSec=30min
`;

  const timer = `[Unit]
Description=Daily Tickist local backup retention

[Timer]
OnCalendar=*-*-* 03:50:00 UTC
Persistent=true
RandomizedDelaySec=15min
AccuracySec=1min
Unit=tickist-backup-retention.service

[Install]
WantedBy=timers.target
`;

  await mkdir(output, { recursive: true, mode: 0o700 });
  await writeFile(
    path.join(output, 'tickist-backup-retention.service'),
    service,
    { flag: 'wx', mode: 0o600 }
  );
  await writeFile(path.join(output, 'tickist-backup-retention.timer'), timer, {
    flag: 'wx',
    mode: 0o600,
  });
}
