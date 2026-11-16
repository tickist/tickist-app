import { z } from 'zod';

export const PROJECT_SORT_OPTIONS = [
  'priority-desc',
  'priority-asc',
  'due-asc',
  'due-desc',
  'created-asc',
  'created-desc',
  'modified-asc',
  'modified-desc',
  'alpha-asc',
  'alpha-desc',
] as const;

export type ProjectSortOption = (typeof PROJECT_SORT_OPTIONS)[number];

export const DEFAULT_PROJECT_SORT: ProjectSortOption = 'priority-desc';

/** Per-browser sort choice for each project list, keyed by project ID. */
export const PROJECT_SORT_STORAGE_KEY = 'tickist.project-sort.v1';

const storedSortsSchema = z.record(z.string(), z.enum(PROJECT_SORT_OPTIONS));

export type ProjectSorts = z.infer<typeof storedSortsSchema>;

/** Reads saved sorts; unknown, invalid or unavailable storage yields none. */
export function readProjectSorts(storage: Storage | undefined): ProjectSorts {
  try {
    const raw = storage?.getItem(PROJECT_SORT_STORAGE_KEY);

    if (!raw) return {};

    const parsed = storedSortsSchema.safeParse(JSON.parse(raw));

    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

export function writeProjectSorts(
  storage: Storage | undefined,
  sorts: ProjectSorts
): void {
  try {
    storage?.setItem(PROJECT_SORT_STORAGE_KEY, JSON.stringify(sorts));
  } catch {
    // Private windows or blocked storage: the choice lasts for this page only.
  }
}
