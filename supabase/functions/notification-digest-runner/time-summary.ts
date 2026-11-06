// "Time worked today" section of the daily summary email. Plain TypeScript
// without Deno APIs so the Node tests in tools/email can import it.
//
// Rows come from public.time_report_for_user, which already limits tasks to
// those the recipient can access and buckets entries by the account timezone.
// Task and project names on shared projects may be written by another user, so
// every name goes through cleanDisplayText and escapeHtml, and none of them is
// used in the email subject.
import { cleanDisplayText } from '../_shared/common.ts';
import { escapeHtml } from '../_shared/email-layout.ts';

export interface TimeReportRow {
  task_id: string;
  my_seconds: number | string | null;
  everyone_seconds: number | string | null;
}

export interface TimeTaskRow {
  id: string;
  name: string | null;
  project_id: string | null;
}

export interface TimeProjectRow {
  id: string;
  name: string | null;
  ancestor_id: string | null;
  owner_id: string;
}

// Data access used by loadTimeSummary; the runner backs it with Supabase.
export interface TimeSummarySources {
  fetchReport(): Promise<TimeReportRow[]>;
  fetchTasks(taskIds: string[]): Promise<TimeTaskRow[]>;
  fetchProjects(projectIds: string[]): Promise<TimeProjectRow[]>;
  // Returns the ids among projectIds where the recipient is an accepted member.
  fetchAcceptedMemberships(projectIds: string[]): Promise<string[]>;
}

export interface TimeSummaryTask {
  name: string;
  subprojectName: string | null;
  mySeconds: number;
  everyoneSeconds: number;
}

export interface TimeSummaryGroup {
  projectName: string | null;
  mySeconds: number;
  everyoneSeconds: number;
  tasks: TimeSummaryTask[];
}

export interface TimeSummary {
  dateKey: string;
  mySeconds: number;
  everyoneSeconds: number;
  groups: TimeSummaryGroup[];
  hiddenTaskCount: number;
}

// The RPC is ordered by everyone_seconds and limited to this many task rows,
// which also keeps the task id filter of the follow-up query short.
export const MAX_TIME_REPORT_ROWS = 100;
export const MAX_LISTED_TIME_TASKS = 50;
export const MAX_PROJECT_DEPTH = 16;
const MAX_TASK_NAME = 120;
const MAX_PROJECT_NAME = 80;

const toSeconds = (value: number | string | null): number => {
  const seconds = Number(value ?? 0);
  return Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds) : 0;
};

// "1 h 25 min", "2 h", "25 min"; a positive duration under half a minute is
// "<1 min" so it does not read as nothing.
export function formatDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes === 0) {
    return seconds > 0 ? '<1 min' : '0 min';
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {
    return `${minutes} min`;
  }
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

// Loads everything the section needs: the report, the referenced tasks, their
// projects and ancestors (one query per hierarchy level), and the recipient's
// memberships among projects they do not own. Returns null when nothing was
// logged for the day.
export async function loadTimeSummary(
  userId: string,
  dateKey: string,
  sources: TimeSummarySources
): Promise<TimeSummary | null> {
  const rows = (await sources.fetchReport()).filter(
    (row) => toSeconds(row.everyone_seconds) > 0
  );
  if (rows.length === 0) {
    return null;
  }

  const tasks = await sources.fetchTasks([
    ...new Set(rows.map((row) => row.task_id)),
  ]);

  const projects = new Map<string, TimeProjectRow>();
  let pending = [
    ...new Set(
      tasks
        .map((task) => task.project_id)
        .filter((id): id is string => typeof id === 'string')
    ),
  ];
  for (
    let depth = 0;
    depth < MAX_PROJECT_DEPTH && pending.length > 0;
    depth += 1
  ) {
    for (const project of await sources.fetchProjects(pending)) {
      projects.set(project.id, project);
    }
    pending = [
      ...new Set(
        pending
          .map((id) => projects.get(id)?.ancestor_id)
          .filter(
            (id): id is string => typeof id === 'string' && !projects.has(id)
          )
      ),
    ];
  }

  const notOwned = [...projects.values()]
    .filter((project) => project.owner_id !== userId)
    .map((project) => project.id);
  const memberOf = new Set(
    notOwned.length > 0 ? await sources.fetchAcceptedMemberships(notOwned) : []
  );

  return buildTimeSummary(
    dateKey,
    rows,
    tasks,
    projects,
    (project) => project.owner_id === userId || memberOf.has(project.id)
  );
}

// Groups task rows by root project. Subproject tasks roll up into the topmost
// ancestor the recipient can access, so a member of a shared subproject never
// sees the name of a parent project that was not shared with them.
export function buildTimeSummary(
  dateKey: string,
  rows: TimeReportRow[],
  tasks: TimeTaskRow[],
  projects: Map<string, TimeProjectRow>,
  canAccess: (project: TimeProjectRow) => boolean
): TimeSummary | null {
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const groups = new Map<string, TimeSummaryGroup>();

  for (const row of rows) {
    const task = taskById.get(row.task_id);
    const everyoneSeconds = toSeconds(row.everyone_seconds);
    if (!task || everyoneSeconds === 0) {
      continue;
    }
    const mySeconds = Math.min(toSeconds(row.my_seconds), everyoneSeconds);

    const project = task.project_id ? projects.get(task.project_id) : undefined;
    const visible = project && canAccess(project) ? project : null;
    const root = visible ? findRoot(visible, projects, canAccess) : null;
    const groupKey = root?.id ?? '';
    let group = groups.get(groupKey);
    if (!group) {
      group = {
        projectName: root
          ? displayName(root.name, MAX_PROJECT_NAME, 'Untitled project')
          : null,
        mySeconds: 0,
        everyoneSeconds: 0,
        tasks: [],
      };
      groups.set(groupKey, group);
    }

    group.mySeconds += mySeconds;
    group.everyoneSeconds += everyoneSeconds;
    group.tasks.push({
      name: displayName(task.name, MAX_TASK_NAME, 'Untitled task'),
      subprojectName:
        visible && root && visible.id !== root.id
          ? displayName(visible.name, MAX_PROJECT_NAME, 'Untitled project')
          : null,
      mySeconds,
      everyoneSeconds,
    });
  }

  if (groups.size === 0) {
    return null;
  }

  const sortedGroups = [...groups.values()].sort(
    (a, b) =>
      b.everyoneSeconds - a.everyoneSeconds ||
      // The "No project" group goes last among equals.
      (a.projectName === null ? 1 : 0) - (b.projectName === null ? 1 : 0) ||
      (a.projectName ?? '').localeCompare(b.projectName ?? '')
  );

  let budget = MAX_LISTED_TIME_TASKS;
  let hiddenTaskCount = 0;
  const listedGroups: TimeSummaryGroup[] = [];
  for (const group of sortedGroups) {
    group.tasks.sort(
      (a, b) =>
        b.everyoneSeconds - a.everyoneSeconds || a.name.localeCompare(b.name)
    );
    const listed = group.tasks.slice(0, budget);
    hiddenTaskCount += group.tasks.length - listed.length;
    budget -= listed.length;
    if (listed.length > 0) {
      listedGroups.push({ ...group, tasks: listed });
    }
  }

  return {
    dateKey,
    mySeconds: sortedGroups.reduce((sum, group) => sum + group.mySeconds, 0),
    everyoneSeconds: sortedGroups.reduce(
      (sum, group) => sum + group.everyoneSeconds,
      0
    ),
    groups: listedGroups,
    hiddenTaskCount,
  };
}

export function renderTimeSummaryHtml(summary: TimeSummary | null): string {
  if (!summary) {
    return '';
  }

  const cell = 'padding:6px 0;border-bottom:1px solid #e2e8f0;';
  const number = `${cell}padding-left:12px;text-align:right;white-space:nowrap;`;
  const rows = summary.groups
    .map((group) => {
      const groupRow =
        `<tr><td style="${cell}padding-top:14px;font-weight:700;color:#0f172a;">${escapeHtml(
          group.projectName ?? 'No project'
        )}</td>` +
        `<td style="${number}padding-top:14px;font-weight:700;color:#0f172a;">${formatDuration(
          group.mySeconds
        )}</td>` +
        `<td style="${number}padding-top:14px;font-weight:700;color:#0f172a;">${formatDuration(
          group.everyoneSeconds
        )}</td></tr>`;
      const taskRows = group.tasks
        .map((task) => {
          const subproject = task.subprojectName
            ? ` <span style="color:#64748b;">(${escapeHtml(
                task.subprojectName
              )})</span>`
            : '';
          return (
            `<tr><td style="${cell}padding-left:12px;">${escapeHtml(
              task.name
            )}${subproject}</td>` +
            `<td style="${number}">${formatDuration(task.mySeconds)}</td>` +
            `<td style="${number}">${formatDuration(
              task.everyoneSeconds
            )}</td></tr>`
          );
        })
        .join('');
      return groupRow + taskRows;
    })
    .join('');
  const hidden =
    summary.hiddenTaskCount > 0
      ? `<p>${formatHiddenTasks(summary.hiddenTaskCount)}</p>`
      : '';

  return [
    `<p><strong>Time worked today</strong><br>${escapeHtml(
      summary.dateKey
    )}</p>`,
    `<p>Me: ${formatDuration(
      summary.mySeconds
    )} &middot; Everyone: ${formatDuration(summary.everyoneSeconds)}</p>`,
    `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:0 0 16px;font-size:14px;line-height:20px;">`,
    `<tr><th align="left" style="${cell}text-align:left;">Task</th>`,
    `<th align="right" style="${number}">Me</th>`,
    `<th align="right" style="${number}">Everyone</th></tr>`,
    rows,
    `</table>`,
    hidden,
  ].join('');
}

export function renderTimeSummaryText(summary: TimeSummary | null): string {
  if (!summary) {
    return '';
  }

  const lines = [
    `Time worked today (${summary.dateKey}):`,
    `Me: ${formatDuration(summary.mySeconds)}, everyone: ${formatDuration(
      summary.everyoneSeconds
    )}`,
  ];
  for (const group of summary.groups) {
    lines.push(
      ``,
      `${group.projectName ?? 'No project'} - me ${formatDuration(
        group.mySeconds
      )}, everyone ${formatDuration(group.everyoneSeconds)}`
    );
    for (const task of group.tasks) {
      const subproject = task.subprojectName ? ` (${task.subprojectName})` : '';
      lines.push(
        `- ${task.name}${subproject}: me ${formatDuration(
          task.mySeconds
        )}, everyone ${formatDuration(task.everyoneSeconds)}`
      );
    }
  }
  if (summary.hiddenTaskCount > 0) {
    lines.push(``, formatHiddenTasks(summary.hiddenTaskCount));
  }
  return lines.join('\n');
}

function formatHiddenTasks(count: number): string {
  return `${count} more task${count === 1 ? ' is' : 's are'} not listed.`;
}

function findRoot(
  project: TimeProjectRow,
  projects: Map<string, TimeProjectRow>,
  canAccess: (project: TimeProjectRow) => boolean
): TimeProjectRow {
  const seen = new Set([project.id]);
  let root = project;
  while (root.ancestor_id && seen.size <= MAX_PROJECT_DEPTH) {
    const parent = projects.get(root.ancestor_id);
    if (!parent || seen.has(parent.id) || !canAccess(parent)) {
      break;
    }
    seen.add(parent.id);
    root = parent;
  }
  return root;
}

function displayName(
  value: string | null,
  maxLength: number,
  fallback: string
): string {
  const cleaned = cleanDisplayText(value ?? '', maxLength);
  return cleaned.length > 0 ? cleaned : fallback;
}
