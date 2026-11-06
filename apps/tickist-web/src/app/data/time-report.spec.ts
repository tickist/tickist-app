import { describe, expect, it } from 'vitest';
import type { Project } from './project-data.service';
import type { Tag } from './tag-data.service';
import type { Task } from './task-data.service';
import { buildTimeReport } from './time-report';
import type { TimeReportRow } from './time-tracking.service';

function project(id: string, name: string, ancestorId: string | null): Project {
  // SAFETY: the report reads only id, name and ancestorId from projects.
  return { id, name, ancestorId } as Project;
}

function task(
  id: string,
  name: string,
  projectId: string | null,
  tags: string[] = []
): Task {
  // SAFETY: the report reads only id, name, projectId and tags from tasks.
  return { id, name, projectId, tags } as Task;
}

function row(
  taskId: string,
  mySeconds: number,
  everyoneSeconds: number
): TimeReportRow {
  return { workDate: '2026-11-04', taskId, mySeconds, everyoneSeconds };
}

const projects = [
  project('root', 'Client A', null),
  project('child', 'Website', 'root'),
  project('other', 'Private', null),
];

const tags: Tag[] = [
  { id: 'tag-dev', ownerId: 'u', name: 'dev' },
  { id: 'tag-call', ownerId: 'u', name: 'call' },
];

const tasks = [
  task('t1', 'Homepage', 'child', ['tag-dev']),
  task('t2', 'Kickoff', 'root', ['tag-dev', 'tag-call']),
  task('t3', 'Groceries', 'other'),
  task('t4', 'Loose', null),
];

describe('buildTimeReport', () => {
  it('rolls subprojects into the root project and keeps both columns', () => {
    const report = buildTimeReport(
      [row('t1', 1800, 3600), row('t2', 600, 600), row('t3', 300, 300)],
      tasks,
      projects,
      tags,
      'project'
    );

    expect(report.mySeconds).toBe(2700);
    expect(report.everyoneSeconds).toBe(4500);
    expect(report.groups.map((group) => group.label)).toEqual([
      'Client A',
      'Private',
    ]);
    const client = report.groups[0];

    expect(client?.everyoneSeconds).toBe(4200);
    expect(client?.tasks.map((line) => [line.name, line.context])).toEqual([
      ['Homepage', 'Website'],
      ['Kickoff', null],
    ]);
  });

  it('adds rows of the same task across days', () => {
    const report = buildTimeReport(
      [row('t1', 60, 60), { ...row('t1', 120, 180), workDate: '2026-11-05' }],
      tasks,
      projects,
      tags,
      'project'
    );

    expect(report.groups[0]?.tasks[0]?.mySeconds).toBe(180);
    expect(report.groups[0]?.tasks[0]?.everyoneSeconds).toBe(240);
  });

  it('lists a task under each of its tags and keeps the day total per task', () => {
    const report = buildTimeReport(
      [row('t2', 600, 600), row('t3', 300, 300)],
      tasks,
      projects,
      tags,
      'tag'
    );

    expect(report.mySeconds).toBe(900);
    expect(
      report.groups.map((group) => [group.label, group.mySeconds])
    ).toEqual([
      ['call', 600],
      ['dev', 600],
      ['No tag', 300],
    ]);
  });

  it('groups tasks without a project and unknown tasks safely', () => {
    const report = buildTimeReport(
      [row('t4', 60, 60), row('missing', 30, 30)],
      tasks,
      projects,
      tags,
      'project'
    );

    expect(report.groups).toHaveLength(1);
    expect(report.groups[0]?.label).toBe('No project');
    expect(report.groups[0]?.tasks.map((line) => line.name)).toEqual([
      'Loose',
      'Unavailable task',
    ]);
  });

  it('stops at the highest readable project when a parent is not shared', () => {
    const report = buildTimeReport(
      [row('t1', 60, 60)],
      tasks,
      [project('child', 'Website', 'root')],
      tags,
      'project'
    );

    expect(report.groups[0]?.label).toBe('Website');
    expect(report.groups[0]?.tasks[0]?.context).toBeNull();
  });

  it('flags whether anyone else logged time', () => {
    const solo = buildTimeReport(
      [row('t3', 300, 300)],
      tasks,
      projects,
      tags,
      'project'
    );

    const shared = buildTimeReport(
      [row('t3', 300, 300), row('t1', 0, 600)],
      tasks,
      projects,
      tags,
      'project'
    );

    expect(solo.hasOthers).toBe(false);
    expect(shared.hasOthers).toBe(true);
  });

  it('splits my time per requested day', () => {
    const report = buildTimeReport(
      [
        row('t1', 60, 120),
        { ...row('t1', 300, 300), workDate: '2026-11-06' },
        { ...row('t3', 30, 30), workDate: '2026-11-06' },
        { ...row('t3', 999, 999), workDate: '2026-12-01' },
      ],
      tasks,
      projects,
      tags,
      'project',
      ['2026-11-04', '2026-11-05', '2026-11-06']
    );

    expect(report.myByDay).toEqual([60, 0, 330]);
    expect(report.groups[0]?.myByDay).toEqual([0, 0, 30]);
    expect(report.groups[1]?.myByDay).toEqual([60, 0, 300]);
    expect(report.groups[1]?.tasks[0]?.myByDay).toEqual([60, 0, 300]);
  });

  it('returns no day columns unless days are requested', () => {
    const report = buildTimeReport(
      [row('t1', 60, 60)],
      tasks,
      projects,
      tags,
      'project'
    );

    expect(report.myByDay).toEqual([]);
    expect(report.groups[0]?.tasks[0]?.myByDay).toEqual([]);
  });
});
