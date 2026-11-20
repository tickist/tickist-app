// Completed work for the email summaries: tasks marked done plus completed
// occurrences of recurring tasks, which stay open with their next date.

export type ProjectRef =
  | { name: string | null }
  | { name: string | null }[]
  | null;

export interface CompletedTaskRow {
  id: string;
  name: string;
  finish_date: string | null;
  when_complete: string | null;
  project: ProjectRef;
}

export interface OccurrenceCompletionRow {
  id: string;
  completed_at: string;
  task:
    | { name: string; project: ProjectRef }
    | { name: string; project: ProjectRef }[]
    | null;
}

/** Newest first; an occurrence whose task is gone is skipped. */
export function mergeCompletedRows(
  tasks: CompletedTaskRow[],
  occurrences: OccurrenceCompletionRow[]
): CompletedTaskRow[] {
  const fromOccurrences = occurrences.flatMap((row) => {
    const task = Array.isArray(row.task) ? row.task[0] : row.task;

    if (!task) return [];

    return [
      {
        id: row.id,
        name: task.name,
        finish_date: null,
        when_complete: row.completed_at,
        project: task.project,
      },
    ];
  });

  return [...tasks, ...fromOccurrences].sort((a, b) =>
    (b.when_complete ?? '').localeCompare(a.when_complete ?? '')
  );
}
