import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeCompletedRows } from '../../supabase/functions/notification-digest-runner/completed-tasks.ts';

const done = {
  id: 'task-done',
  name: 'Send the invoice',
  finish_date: '2026-11-18T00:00:00Z',
  when_complete: '2026-11-19T09:00:00Z',
  project: { name: 'Work' },
};

test('completed occurrences of recurring tasks count as completed work', () => {
  const merged = mergeCompletedRows(
    [done],
    [
      {
        id: 'occurrence-1',
        completed_at: '2026-11-19T10:00:00Z',
        task: { name: 'Daily review', project: [{ name: 'Routines' }] },
      },
    ]
  );

  assert.deepEqual(
    merged.map((row) => [row.id, row.name, row.when_complete]),
    [
      ['occurrence-1', 'Daily review', '2026-11-19T10:00:00Z'],
      ['task-done', 'Send the invoice', '2026-11-19T09:00:00Z'],
    ]
  );
  assert.deepEqual(merged[0].project, [{ name: 'Routines' }]);
});

test('an occurrence whose task is gone is skipped', () => {
  assert.deepEqual(
    mergeCompletedRows(
      [done],
      [{ id: 'occurrence-2', completed_at: '2026-11-19T10:00:00Z', task: null }]
    ),
    [done]
  );
});
