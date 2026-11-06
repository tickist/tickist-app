import type { Project } from './project-data.service';
import type { Tag } from './tag-data.service';
import type { Task } from './task-data.service';
import type { TimeReportRow } from './time-tracking.service';

export type TimeReportGrouping = 'project' | 'tag';

export interface TimeReportTaskLine {
  taskId: string;
  name: string;
  /** Subproject name when the task sits below the group's root project. */
  context: string | null;
  mySeconds: number;
  everyoneSeconds: number;
  /** My seconds per requested day, aligned with the `days` argument. */
  myByDay: number[];
}

export interface TimeReportGroup {
  key: string;
  label: string;
  mySeconds: number;
  everyoneSeconds: number;
  myByDay: number[];
  tasks: TimeReportTaskLine[];
}

export interface TimeReport {
  groups: TimeReportGroup[];
  mySeconds: number;
  everyoneSeconds: number;
  myByDay: number[];
  /** True when someone else logged time, so "Everyone" adds information. */
  hasOthers: boolean;
}

const NO_PROJECT = 'No project';

const NO_TAG = 'No tag';

const UNKNOWN_TASK = 'Unavailable task';

/**
 * Groups per-task totals by root project (subprojects roll up) or by tag.
 * A task with several tags appears under each tag, so tag groups can add up
 * to more than the day total; the day total is always per task.
 * Pass `days` (date keys) to also get my seconds per day for each line.
 */
export function buildTimeReport(
  rows: readonly TimeReportRow[],
  tasks: readonly Task[],
  projects: readonly Project[],
  tags: readonly Tag[],
  grouping: TimeReportGrouping,
  days: readonly string[] = []
): TimeReport {
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const tagById = new Map(tags.map((tag) => [tag.id, tag]));
  const dayIndex = new Map(days.map((day, index) => [day, index]));

  const perTask = new Map<
    string,
    { my: number; everyone: number; byDay: number[] }
  >();

  for (const row of rows) {
    const current = perTask.get(row.taskId) ?? {
      my: 0,
      everyone: 0,
      byDay: emptyDays(days),
    };

    const index = dayIndex.get(row.workDate);

    current.my += row.mySeconds;
    current.everyone += row.everyoneSeconds;

    if (index !== undefined) {
      current.byDay[index] = (current.byDay[index] ?? 0) + row.mySeconds;
    }

    perTask.set(row.taskId, current);
  }

  const groups = new Map<string, TimeReportGroup>();
  const myByDay = emptyDays(days);
  let mySeconds = 0;
  let everyoneSeconds = 0;

  for (const [taskId, totals] of perTask) {
    const task = taskById.get(taskId);

    mySeconds += totals.my;
    everyoneSeconds += totals.everyone;
    addDays(myByDay, totals.byDay);

    for (const target of groupTargets(task, grouping, projectById, tagById)) {
      const group = groups.get(target.key) ?? {
        key: target.key,
        label: target.label,
        mySeconds: 0,
        everyoneSeconds: 0,
        myByDay: emptyDays(days),
        tasks: [],
      };

      group.mySeconds += totals.my;
      group.everyoneSeconds += totals.everyone;
      addDays(group.myByDay, totals.byDay);
      group.tasks.push({
        taskId,
        name: task?.name ?? UNKNOWN_TASK,
        context: target.context,
        mySeconds: totals.my,
        everyoneSeconds: totals.everyone,
        myByDay: [...totals.byDay],
      });
      groups.set(target.key, group);
    }
  }

  const sortedGroups = [...groups.values()]
    .map((group) => ({
      ...group,
      tasks: [...group.tasks].sort(
        (a, b) =>
          b.everyoneSeconds - a.everyoneSeconds || a.name.localeCompare(b.name)
      ),
    }))
    .sort(
      (a, b) =>
        b.everyoneSeconds - a.everyoneSeconds || a.label.localeCompare(b.label)
    );

  return {
    groups: sortedGroups,
    mySeconds,
    everyoneSeconds,
    myByDay,
    hasOthers: everyoneSeconds > mySeconds,
  };
}

function emptyDays(days: readonly string[]): number[] {
  return days.map(() => 0);
}

function addDays(target: number[], source: readonly number[]): void {
  source.forEach((seconds, index) => {
    target[index] = (target[index] ?? 0) + seconds;
  });
}

/** The top-level project of a project, guarding against broken cycles. */
export function rootProject(
  projectId: string,
  projectById: ReadonlyMap<string, Project>
): Project | undefined {
  let current = projectById.get(projectId);
  const seen = new Set<string>();

  while (current?.ancestorId && !seen.has(current.id)) {
    seen.add(current.id);
    const parent = projectById.get(current.ancestorId);

    if (!parent) break;
    current = parent;
  }

  return current;
}

function groupTargets(
  task: Task | undefined,
  grouping: TimeReportGrouping,
  projectById: ReadonlyMap<string, Project>,
  tagById: ReadonlyMap<string, Tag>
): { key: string; label: string; context: string | null }[] {
  if (grouping === 'tag') {
    const tagIds = task?.tags ?? [];

    if (tagIds.length === 0) {
      return [{ key: 'tag:none', label: NO_TAG, context: null }];
    }

    return tagIds.map((tagId) => ({
      key: `tag:${tagId}`,
      label: tagById.get(tagId)?.name ?? 'Shared tag',
      context: null,
    }));
  }

  const project = task?.projectId ? projectById.get(task.projectId) : undefined;

  if (!project) {
    return [{ key: 'project:none', label: NO_PROJECT, context: null }];
  }

  const root = rootProject(project.id, projectById) ?? project;

  return [
    {
      key: `project:${root.id}`,
      label: root.name,
      context: root.id === project.id ? null : project.name,
    },
  ];
}
