import assert from 'node:assert/strict';
import {
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  utimes,
  writeFile,
} from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { encryptFile, sha256File } from './archive-crypto.mjs';
import { applyPruning, parsePruneOptions, planPruning } from './prune.mjs';

const run = promisify(execFile);

const NOW = Date.parse('2026-09-29T12:00:00.000Z');

const OLD = '2026-08-01T00-00-00-000Z';

const RECENT = '2026-09-20T00-00-00-000Z';

const BOUNDARY = '2026-08-30T12-00-00-000Z';

async function fixture(testContext) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tickist-prune-test-'));
  testContext.after(() => rm(root, { recursive: true, force: true }));

  return root;
}

async function archive(root, timestamp, project = 'testproject') {
  const file = `tickist-${project}-${timestamp}.enc`;
  const input = path.join(root, 'fixture.txt');
  await writeFile(input, 'Synthetic backup fixture');
  await encryptFile(
    input,
    path.join(root, file),
    'test-only-encryption-password-1234'
  );
  await writeFile(
    path.join(root, `${file}.sha256`),
    `${await sha256File(path.join(root, file))}  ${file}\n`
  );

  return file;
}

test('preview selects only expired pairs for the named project and changes nothing', async (t) => {
  const root = await fixture(t);
  const old = await archive(root, OLD);
  await archive(root, RECENT);
  await archive(root, OLD, 'anotherproject');
  await writeFile(path.join(root, 'unrelated.enc'), 'leave intact');
  await utimes(path.join(root, old), new Date(NOW), new Date(NOW));
  const before = await readdir(root);
  const plan = await planPruning(root, 'testproject', NOW);
  assert.deepEqual(
    plan.candidates.map((item) => item.file),
    [old]
  );
  assert.deepEqual(await readdir(root), before);
  assert.equal(plan.cutoff, '2026-08-30T12:00:00.000Z');
});

test('exactly 30 days is expired and a newer backup stays', async (t) => {
  const root = await fixture(t);
  const boundary = await archive(root, BOUNDARY);
  await archive(root, '2026-08-30T12-00-00-001Z');
  assert.deepEqual(
    (await planPruning(root, 'testproject', NOW)).candidates.map(
      (item) => item.file
    ),
    [boundary]
  );
});

test('apply requires exact project and canonical directory confirmation', async (t) => {
  const root = await fixture(t);
  const old = await archive(root, OLD);
  const plan = await planPruning(root, 'testproject', NOW);
  await assert.rejects(applyPruning(plan, root, 'wrongproject'), /matching/);
  await assert.rejects(
    applyPruning(plan, path.dirname(root), 'testproject'),
    /matching/
  );
  assert.ok(await readFile(path.join(root, old)));
  assert.equal(await applyPruning(plan, root, 'testproject'), 1);
  assert.ok(!(await readdir(root)).includes(old));
  assert.ok(!(await readdir(root)).includes(`${old}.sha256`));
});

test('symlink archives, symlink checksums, missing checksums and invalid dates are skipped', async (t) => {
  const root = await fixture(t);
  const old = await archive(root, OLD);
  const checksumTarget = path.join(root, 'outside-checksum');
  await writeFile(checksumTarget, 'preserved');
  await rm(path.join(root, `${old}.sha256`));
  await symlink(checksumTarget, path.join(root, `${old}.sha256`));
  const link = `tickist-testproject-2026-08-02T00-00-00-000Z.enc`;
  await symlink(path.join(root, old), path.join(root, link));
  await writeFile(path.join(root, `${link}.sha256`), 'fixture');
  await writeFile(
    path.join(root, 'tickist-testproject-2026-08-03T00-00-00-000Z.enc'),
    'no checksum'
  );
  await writeFile(
    path.join(root, 'tickist-testproject-2026-02-31T00-00-00-000Z.enc'),
    'invalid date'
  );
  const plan = await planPruning(root, 'testproject', NOW);
  assert.equal(plan.candidates.length, 0);
  assert.equal(plan.skipped.length, 4);
  assert.equal(await applyPruning(plan, root, 'testproject'), 0);
  assert.equal(await readFile(checksumTarget, 'utf8'), 'preserved');
});

test('directory symlinks are rejected', async (t) => {
  const root = await fixture(t);
  const link = `${root}-link`;
  await symlink(root, link);
  t.after(() => rm(link));
  await assert.rejects(
    planPruning(link, 'testproject', NOW),
    /without symbolic links/
  );
});

test('a changed archive blocks apply without deleting other candidates', async (t) => {
  const root = await fixture(t);
  const old = await archive(root, OLD);
  const other = await archive(root, BOUNDARY);
  const plan = await planPruning(root, 'testproject', NOW);
  await writeFile(path.join(root, other), 'changed');
  await assert.rejects(
    applyPruning(plan, root, 'testproject'),
    /changed after preview/
  );
  assert.ok(await readFile(path.join(root, old)));
});

test('bad checksums and unsupported formats block all deletion', async (t) => {
  const root = await fixture(t);
  const old = await archive(root, OLD);
  const bad = await archive(root, BOUNDARY);
  await writeFile(
    path.join(root, `${bad}.sha256`),
    `${'0'.repeat(64)}  ${bad}\n`
  );
  await assert.rejects(
    applyPruning(
      await planPruning(root, 'testproject', NOW),
      root,
      'testproject'
    ),
    /checksum mismatch/
  );
  assert.ok(await readFile(path.join(root, old)));
  await writeFile(path.join(root, bad), 'Not an encrypted archive\n');
  await writeFile(
    path.join(root, `${bad}.sha256`),
    `${await sha256File(path.join(root, bad))}  ${bad}\n`
  );
  await assert.rejects(
    applyPruning(
      await planPruning(root, 'testproject', NOW),
      root,
      'testproject'
    ),
    /JSON|header/
  );
  assert.ok(await readFile(path.join(root, old)));
});

test('CLI defaults to preview and rejects missing project or duplicate options', async (t) => {
  const root = await fixture(t);
  const old = await archive(root, OLD);
  assert.throws(() => parsePruneOptions([]), /project is required/);
  assert.throws(
    () => parsePruneOptions(['--project=a', '--project=b']),
    /Duplicate/
  );
  assert.throws(() => parsePruneOptions(['--project=../wrong']), /Invalid/);

  const { stdout } = await run(process.execPath, [
    path.resolve('tools/backup/prune.mjs'),
    '--project=testproject',
    `--dir=${root}`,
  ]);

  assert.equal(JSON.parse(stdout).mode, 'preview');
  assert.ok(await readFile(path.join(root, old)));
});

test('schedule uses explicit scope without a shell and escapes systemd specifiers', async (t) => {
  const root = await fixture(t);
  const { writeRetentionSchedule } = await import('./retention-schedule.mjs');
  await writeRetentionSchedule(
    '/tmp/repository space%name',
    root,
    '/tmp/backup space%name',
    'testproject',
    process.execPath
  );

  const service = await readFile(
    path.join(root, 'tickist-backup-retention.service'),
    'utf8'
  );

  assert.match(service, /backup space%%name/);
  assert.match(service, /"--apply" "--confirm-project=testproject"/);
  assert.match(service, /"--confirm-dir=\/tmp\/backup space%%name"/);
  assert.ok(!service.includes('/bin/sh'));

  const timer = await readFile(
    path.join(root, 'tickist-backup-retention.timer'),
    'utf8'
  );

  assert.match(timer, /OnCalendar=\*-\*-\* 03:50:00 UTC/);
  assert.match(timer, /Persistent=true/);
  await assert.rejects(
    writeRetentionSchedule(
      '/tmp/repo',
      root,
      '/tmp/backups\ninjected',
      'testproject',
      process.execPath
    ),
    /Invalid systemd/
  );
});
