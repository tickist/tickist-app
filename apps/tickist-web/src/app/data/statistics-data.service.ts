import {
  computed,
  effect,
  inject,
  Injectable,
  signal,
  untracked,
} from '@angular/core';
import { SUPABASE_CLIENT } from '../config/supabase.provider';
import { SupabaseSessionService } from '../features/auth/supabase-session.service';

export const STATISTICS_WINDOW_DAYS = 30;

export type StatsProjectGroupKey = 'active' | 'someday' | 'routine';

export interface StatsSummary {
  completedCount: number;
  completedLateCount: number;
  openOverdueCount: number;
  inactiveProjectsCount: number;
}

export interface InactiveProjectStat {
  projectId: string;
  name: string;
  color: string;
  icon: string;
  projectType: string;
  staleDays: number;
  lastActivityAt: string | null;
  openTasks: number;
  overdueOpenTasks: number;
}

export interface StatsProjectGroup {
  key: StatsProjectGroupKey;
  label: string;
  inactiveProjects: InactiveProjectStat[];
}

export interface StatsOverview {
  windowDays: number;
  summary: StatsSummary;
  groups: StatsProjectGroup[];
}

const DEFAULT_GROUP_LABELS: Record<StatsProjectGroupKey, string> = {
  active: 'Active',
  someday: 'Someday / Maybe',
  routine: 'Routine',
};

const GROUP_ORDER: StatsProjectGroupKey[] = ['active', 'someday', 'routine'];

@Injectable({ providedIn: 'root' })
export class StatisticsDataService {
  private readonly supabase = inject(SUPABASE_CLIENT, { optional: true });
  private readonly session = inject(SupabaseSessionService);

  private readonly overviewState = signal<StatsOverview>(
    createEmptyStatsOverview()
  );
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly activeState = signal(false);
  private readonly dirtyState = signal(true);
  private refreshSequence = 0;
  private pendingRefreshAfterLoad = false;
  private lastWindowDays = STATISTICS_WINDOW_DAYS;

  readonly overview = computed(() => this.overviewState());
  readonly loading = computed(() => this.loadingState());
  readonly error = computed(() => this.errorState());

  constructor() {
    effect(() => {
      const user = this.session.user();
      if (!user) {
        this.reset();
        return;
      }

      if (this.activeState()) {
        untracked(() => {
          void this.refreshIfNeeded();
        });
      }
    });
  }

  activate(windowDays = STATISTICS_WINDOW_DAYS): void {
    this.activeState.set(true);
    this.lastWindowDays = windowDays;
  }

  deactivate(): void {
    this.activeState.set(false);
  }

  markDirty(windowDays = this.lastWindowDays): void {
    this.lastWindowDays = windowDays;
    this.dirtyState.set(true);

    if (!this.activeState()) {
      return;
    }

    if (!this.session.user()) {
      return;
    }

    if (this.loadingState()) {
      this.pendingRefreshAfterLoad = true;
      return;
    }

    void this.refresh(windowDays);
  }

  async refresh(windowDays = STATISTICS_WINDOW_DAYS): Promise<void> {
    const sequence = ++this.refreshSequence;
    const fallback = createEmptyStatsOverview(windowDays);
    this.lastWindowDays = windowDays;
    this.pendingRefreshAfterLoad = false;

    if (!this.supabase) {
      this.overviewState.set(fallback);
      this.errorState.set(
        'Statistics are unavailable because Supabase is not configured.'
      );
      this.loadingState.set(false);
      this.dirtyState.set(true);
      console.warn('[Statistics] Supabase client missing; skipping fetch.');
      return;
    }

    this.loadingState.set(true);
    this.errorState.set(null);

    const { data, error } = await this.supabase.rpc('get_statistics_overview', {
      window_days: windowDays,
    });

    if (sequence !== this.refreshSequence) {
      return;
    }

    if (error) {
      this.overviewState.set(fallback);
      this.errorState.set('Unable to load statistics right now.');
      this.loadingState.set(false);
      this.dirtyState.set(true);
      console.error('[Statistics] Failed to fetch overview', error);
      await this.flushPendingRefresh(windowDays);
      return;
    }

    this.overviewState.set(normalizeStatsOverview(data, windowDays));
    this.dirtyState.set(false);
    this.errorState.set(null);
    this.loadingState.set(false);
    await this.flushPendingRefresh(windowDays);
  }

  private reset(): void {
    this.refreshSequence += 1;
    this.pendingRefreshAfterLoad = false;
    this.overviewState.set(createEmptyStatsOverview());
    this.loadingState.set(false);
    this.errorState.set(null);
    this.dirtyState.set(true);
  }

  private async refreshIfNeeded(windowDays = this.lastWindowDays): Promise<void> {
    if (this.loadingState()) {
      this.pendingRefreshAfterLoad = true;
      return;
    }

    if (!this.dirtyState() && !this.errorState()) {
      return;
    }

    await this.refresh(windowDays);
  }

  private async flushPendingRefresh(windowDays: number): Promise<void> {
    if (!this.pendingRefreshAfterLoad) {
      return;
    }

    this.pendingRefreshAfterLoad = false;

    if (!this.activeState() || !this.session.user()) {
      this.dirtyState.set(true);
      return;
    }

    await this.refresh(windowDays);
  }
}

export function createEmptyStatsOverview(
  windowDays = STATISTICS_WINDOW_DAYS
): StatsOverview {
  return {
    windowDays,
    summary: {
      completedCount: 0,
      completedLateCount: 0,
      openOverdueCount: 0,
      inactiveProjectsCount: 0,
    },
    groups: GROUP_ORDER.map((key) => ({
      key,
      label: DEFAULT_GROUP_LABELS[key],
      inactiveProjects: [],
    })),
  };
}

function normalizeStatsOverview(
  value: unknown,
  fallbackWindowDays: number
): StatsOverview {
  const record = asRecord(value);
  const windowDays = readInteger(record?.windowDays, fallbackWindowDays);
  const summaryRecord = asRecord(record?.summary);
  const groupsArray = Array.isArray(record?.groups) ? record.groups : [];

  const groupsByKey = new Map<StatsProjectGroupKey, StatsProjectGroup>();
  for (const item of groupsArray) {
    const group = parseGroup(item);
    if (group) {
      groupsByKey.set(group.key, group);
    }
  }

  return {
    windowDays,
    summary: {
      completedCount: readInteger(summaryRecord?.completedCount, 0),
      completedLateCount: readInteger(summaryRecord?.completedLateCount, 0),
      openOverdueCount: readInteger(summaryRecord?.openOverdueCount, 0),
      inactiveProjectsCount: readInteger(
        summaryRecord?.inactiveProjectsCount,
        0
      ),
    },
    groups: GROUP_ORDER.map(
      (key) =>
        groupsByKey.get(key) ?? {
          key,
          label: DEFAULT_GROUP_LABELS[key],
          inactiveProjects: [],
        }
    ),
  };
}

function parseGroup(value: unknown): StatsProjectGroup | null {
  const record = asRecord(value);
  const key = normalizeGroupKey(record?.key);
  if (!key) {
    return null;
  }

  const inactiveProjects = Array.isArray(record?.inactiveProjects)
    ? record.inactiveProjects
        .map((item) => parseInactiveProject(item, key))
        .filter((item): item is InactiveProjectStat => item !== null)
    : [];

  return {
    key,
    label: readString(record?.label, DEFAULT_GROUP_LABELS[key]),
    inactiveProjects,
  };
}

function parseInactiveProject(
  value: unknown,
  groupKey: StatsProjectGroupKey
): InactiveProjectStat | null {
  const record = asRecord(value);
  const projectId = readString(record?.projectId, '');
  if (!projectId) {
    return null;
  }

  return {
    projectId,
    name: readString(record?.name, 'Untitled project'),
    color: readString(record?.color, '#394264'),
    icon: readString(record?.icon, 'folder'),
    projectType: readString(record?.projectType, groupKey),
    staleDays: readInteger(record?.staleDays, 0),
    lastActivityAt: readNullableString(record?.lastActivityAt),
    openTasks: readInteger(record?.openTasks, 0),
    overdueOpenTasks: readInteger(record?.overdueOpenTasks, 0),
  };
}

function normalizeGroupKey(value: unknown): StatsProjectGroupKey | null {
  if (value === 'active' || value === 'someday' || value === 'routine') {
    return value;
  }
  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function readString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0
    ? value
    : fallback;
}

function readNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function readInteger(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value));
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return Math.max(0, parsed);
    }
  }
  return fallback;
}
