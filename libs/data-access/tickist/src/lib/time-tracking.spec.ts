import { describe, expect, it } from 'vitest';
import {
  assertEntryInterval,
  assertTimeRange,
  buildTimeReport,
  entryMinutes,
  rootProjectId,
  timeEntryErrorMessage,
  type ReportProject,
} from './time-tracking';

const projects: ReportProject[] = [
  { id: 'root', name: 'Client', ancestor_id: null },
  { id: 'child', name: 'Website', ancestor_id: 'root' },
  { id: 'grandchild', name: 'Blog', ancestor_id: 'child' },
  { id: 'other', name: 'Home', ancestor_id: null },
];

const tasks = [
  { id: 't1', name: 'Design', project_id: 'root' },
  { id: 't2', name: 'Write post', project_id: 'grandchild' },
  { id: 't3', name: 'Garden', project_id: 'other' },
  { id: 't4', name: 'Loose', project_id: null },
];

const rows = [
  {
    work_date: '2026-11-02',
    task_id: 't1',
    my_seconds: 1800,
    everyone_seconds: 3600,
  },
  {
    work_date: '2026-11-03',
    task_id: 't2',
    my_seconds: 600,
    everyone_seconds: 600,
  },
  {
    work_date: '2026-11-02',
    task_id: 't2',
    my_seconds: 0,
    everyone_seconds: 900,
  },
  {
    work_date: '2026-11-03',
    task_id: 't3',
    my_seconds: 89,
    everyone_seconds: 89,
  },
  {
    work_date: '2026-11-03',
    task_id: 't4',
    my_seconds: 120,
    everyone_seconds: 120,
  },
];

const base = {
  from: '2026-11-01',
  to: '2026-11-07',
  timezone: 'Europe/Warsaw',
  rows,
  tasks,
  projects,
};

describe('rootProjectId', () => {
  it('walks to the highest accessible ancestor and survives cycles', () => {
    const map = new Map(projects.map((project) => [project.id, project]));

    expect(rootProjectId('grandchild', map)).toBe('root');

    const cyclic = new Map([
      ['a', { id: 'a', name: 'A', ancestor_id: 'b' }],
      ['b', { id: 'b', name: 'B', ancestor_id: 'a' }],
    ]);

    expect(['a', 'b']).toContain(rootProjectId('a', cyclic));

    const hiddenParent = new Map([
      ['a', { id: 'a', name: 'A', ancestor_id: 'missing' }],
    ]);

    expect(rootProjectId('a', hiddenParent)).toBe('a');
  });
});

describe('buildTimeReport', () => {
  it('groups by root project and labels subproject tasks', () => {
    const report = buildTimeReport({
      ...base,
      groupBy: 'project',
      tagsByTask: new Map(),
    });

    expect(report.total).toEqual({ me: 43, everyone: 88 });
    expect(report.days).toEqual([
      { date: '2026-11-02', me: 30, everyone: 75 },
      { date: '2026-11-03', me: 13, everyone: 13 },
    ]);
    expect(report.groups.map((group) => group.name)).toEqual([
      'Client',
      'No project',
      'Home',
    ]);

    const client = report.groups[0];
    expect(client).toMatchObject({ id: 'root', me: 40, everyone: 85 });
    expect(client.tasks).toEqual([
      {
        id: 't1',
        name: 'Design',
        me: 30,
        everyone: 60,
        days: [{ date: '2026-11-02', me: 30, everyone: 60 }],
      },
      {
        id: 't2',
        name: 'Write post',
        project: 'Blog',
        me: 10,
        everyone: 25,
        days: [
          { date: '2026-11-02', me: 0, everyone: 15 },
          { date: '2026-11-03', me: 10, everyone: 10 },
        ],
      },
    ]);
    expect(report.groups[1]).toMatchObject({ id: null, name: 'No project' });
  });

  it('places a task under each of its tags and untagged tasks under No tag', () => {
    const report = buildTimeReport({
      ...base,
      groupBy: 'tag',
      tagsByTask: new Map([
        [
          't1',
          [
            { id: 'tag-a', name: 'billable' },
            { id: 'tag-b', name: 'design' },
          ],
        ],
      ]),
    });

    expect(report.total).toEqual({ me: 43, everyone: 88 });
    expect(report.groups.map((group) => [group.name, group.everyone])).toEqual([
      ['billable', 60],
      ['design', 60],
      ['No tag', 28],
    ]);
    expect(
      report.groups[2].tasks?.find((task) => task.id === 't2')
    ).toMatchObject({
      project: 'Blog',
    });
  });

  it('lists tasks directly when grouped by task', () => {
    const report = buildTimeReport({
      ...base,
      rows: [
        ...rows,
        {
          work_date: '2026-11-04',
          task_id: 'gone',
          my_seconds: 60,
          everyone_seconds: 60,
        },
      ],
      groupBy: 'task',
      tagsByTask: new Map(),
    });

    expect(report.groups[0]).toEqual({
      id: 't1',
      name: 'Design',
      project: 'Client',
      me: 30,
      everyone: 60,
      days: [{ date: '2026-11-02', me: 30, everyone: 60 }],
    });
    expect(report.groups.find((group) => group.id === 'gone')?.name).toBe(
      'Unknown task'
    );
    expect(report.groups.every((group) => group.tasks === undefined)).toBe(
      true
    );
  });
});

describe('time validation helpers', () => {
  it('limits report ranges to 367 inclusive days', () => {
    expect(() => assertTimeRange('2026-01-01', '2027-01-02')).not.toThrow();
    expect(() => assertTimeRange('2026-01-01', '2027-01-03')).toThrow('367');
    expect(() => assertTimeRange('2026-01-02', '2026-01-01')).toThrow(
      'on or after'
    );
  });

  it('checks entry order and length when both ends are known', () => {
    expect(() =>
      assertEntryInterval('2026-11-02T10:00:00Z', '2026-11-02T10:00:00Z')
    ).toThrow('after started_at');
    expect(() =>
      assertEntryInterval(
        '2026-11-02T10:00:00+01:00',
        '2026-11-03T10:00:01+01:00'
      )
    ).toThrow('24 hours');
    expect(() =>
      assertEntryInterval('2026-11-02T10:00:00Z', undefined)
    ).not.toThrow();
  });

  it('counts running entries up to now, capped at 24 hours', () => {
    const start = '2026-11-02T10:00:00.000Z';

    expect(entryMinutes(start, '2026-11-02T10:44:40.000Z')).toBe(45);
    expect(
      entryMinutes(start, null, Date.parse('2026-11-02T10:10:00.000Z'))
    ).toBe(10);
    expect(
      entryMinutes(start, null, Date.parse('2026-11-05T10:00:00.000Z'))
    ).toBe(1440);
  });

  it('maps database errors to client-safe messages', () => {
    expect(timeEntryErrorMessage({ code: '23P01' }, 'x')).toContain('overlaps');
    expect(timeEntryErrorMessage({ code: '22023' }, 'x')).toContain('future');
    expect(timeEntryErrorMessage({ code: '42501' }, 'x')).toContain(
      'Task not found'
    );
    expect(
      timeEntryErrorMessage(
        {
          code: '23514',
          message:
            'new row for relation "task_time_entries" violates check constraint "task_time_entries_max_length"',
        },
        'x'
      )
    ).toBe('A time entry can last at most 24 hours.');
    expect(
      timeEntryErrorMessage(
        {
          code: '23514',
          message: 'violates "task_time_entries_started_at_finite"',
        },
        'x'
      )
    ).toBe('Timestamps must be finite dates.');
    expect(
      timeEntryErrorMessage({ code: 'XX000', message: 'secret' }, 'Failed.')
    ).toBe('Failed.');
  });
});
