import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppViewStateService {
  private readonly searchTermSignal = signal('');
  private readonly selectedProjectIdSignal = signal<string | null>(null);

  readonly searchTerm = this.searchTermSignal.asReadonly();
  readonly selectedProjectId = this.selectedProjectIdSignal.asReadonly();

  updateSearchTerm(value: string) {
    this.searchTermSignal.set(value);
  }

  clearSearch() {
    this.searchTermSignal.set('');
  }

  selectProject(projectId: string | null) {
    this.selectedProjectIdSignal.set(projectId);
  }
}
