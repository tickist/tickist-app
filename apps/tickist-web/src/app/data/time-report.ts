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
}

export interface TimeReportGroup {
  key: string;
  label: string;
  mySeconds: number;
  everyoneSeconds: number;
  tasks: TimeReportTaskLine[];
}

export interface TimeReport {
  groups: TimeReportGroup[];
  mySeconds: number;
  everyoneSeconds: number;
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
 */
export function buildTimeReport(
  rows: readonly TimeReportRow[],
  tasks: readonly Task[],
  projects: readonly Project[],
  tags: readonly Tag[],
  grouping: TimeReportGrouping
): TimeReport {
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const tagById = new Map(tags.map((tag) => [tag.id, tag]));
  const perTask = new Map<string, { my: number; everyone: number }>();

  for (const row of rows) {
    const current = perTask.get(row.taskId) ?? { my: 0, everyone: 0 };

    current.my += row.mySeconds;
    current.everyone += row.everyoneSeconds;
    perTask.set(row.taskId, current);
  }

  const groups = new Map<string, TimeReportGroup>();
  let mySeconds = 0;
  let everyoneSeconds = 0;

  for (const [taskId, totals] of perTask) {
    const task = taskById.get(taskId);

    mySeconds += totals.my;
    everyoneSeconds += totals.everyone;

    for (const target of groupTargets(task, grouping, projectById, tagById)) {
      const group = groups.get(target.key) ?? {
        key: target.key,
        label: target.label,
        mySeconds: 0,
        everyoneSeconds: 0,
        tasks: [],
      };

      group.mySeconds += totals.my;
      group.everyoneSeconds += totals.everyone;
      group.tasks.push({
        taskId,
        name: task?.name ?? UNKNOWN_TASK,
        context: target.context,
        mySeconds: totals.my,
        everyoneSeconds: totals.everyone,
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
    hasOthers: everyoneSeconds > mySeconds,
  };
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
