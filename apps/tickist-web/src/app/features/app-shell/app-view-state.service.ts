import { Injectable, signal } from '@angular/core';

export type DueDateFilter =
  | { mode: 'day'; dateKey: string }
  | { mode: 'month'; monthKey: string }
  | null;

@Injectable({ providedIn: 'root' })
export class AppViewStateService {
  private readonly searchTermSignal = signal('');
  private readonly selectedProjectIdSignal = signal<string | null>(null);
  private readonly excludedProjectIdsSignal = signal<ReadonlySet<string>>(
    new Set()
  );
  private readonly dueDateFilterSignal = signal<DueDateFilter>(null);
  private readonly lastNonSheetAppUrlSignal = signal<string | null>(null);

  readonly searchTerm = this.searchTermSignal.asReadonly();
  readonly selectedProjectId = this.selectedProjectIdSignal.asReadonly();
  readonly excludedProjectIds = this.excludedProjectIdsSignal.asReadonly();
  readonly dueDateFilter = this.dueDateFilterSignal.asReadonly();
  readonly lastNonSettingsAppUrl = this.lastNonSheetAppUrlSignal.asReadonly();
  readonly lastNonSheetAppUrl = this.lastNonSheetAppUrlSignal.asReadonly();

  updateSearchTerm(value: string) {
    this.searchTermSignal.set(value);
  }

  clearSearch() {
    this.searchTermSignal.set('');
  }

  selectProject(projectId: string | null) {
    if (this.selectedProjectIdSignal() !== projectId) {
      this.excludedProjectIdsSignal.set(new Set());
    }
    this.selectedProjectIdSignal.set(projectId);
  }

  setProjectTasksIncluded(projectId: string, included: boolean) {
    this.excludedProjectIdsSignal.update((current) => {
      const next = new Set(current);
      if (included) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  }

  setDayFilter(dateKey: string) {
    this.dueDateFilterSignal.set({ mode: 'day', dateKey });
  }

  setMonthFilter(monthKey: string) {
    this.dueDateFilterSignal.set({ mode: 'month', monthKey });
  }

  clearDateFilter() {
    this.dueDateFilterSignal.set(null);
  }

  rememberLastNonSettingsAppUrl(url: string) {
    this.rememberLastNonSheetAppUrl(url);
  }

  rememberLastNonSheetAppUrl(url: string) {
    this.lastNonSheetAppUrlSignal.set(url);
  }
}
