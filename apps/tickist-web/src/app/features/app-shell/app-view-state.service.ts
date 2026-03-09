import { Injectable, signal } from '@angular/core';

export type DueDateFilter =
  | { mode: 'day'; dateKey: string }
  | { mode: 'month'; monthKey: string }
  | null;

@Injectable({ providedIn: 'root' })
export class AppViewStateService {
  private readonly searchTermSignal = signal('');
  private readonly selectedProjectIdSignal = signal<string | null>(null);
  private readonly dueDateFilterSignal = signal<DueDateFilter>(null);
  private readonly lastNonSettingsAppUrlSignal = signal<string | null>(null);

  readonly searchTerm = this.searchTermSignal.asReadonly();
  readonly selectedProjectId = this.selectedProjectIdSignal.asReadonly();
  readonly dueDateFilter = this.dueDateFilterSignal.asReadonly();
  readonly lastNonSettingsAppUrl =
    this.lastNonSettingsAppUrlSignal.asReadonly();

  updateSearchTerm(value: string) {
    this.searchTermSignal.set(value);
  }

  clearSearch() {
    this.searchTermSignal.set('');
  }

  selectProject(projectId: string | null) {
    this.selectedProjectIdSignal.set(projectId);
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
    this.lastNonSettingsAppUrlSignal.set(url);
  }
}
