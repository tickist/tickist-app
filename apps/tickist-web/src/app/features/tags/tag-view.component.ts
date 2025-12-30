import { Component, computed, inject, signal } from '@angular/core';
import { NgFor, NgIf, UpperCasePipe } from '@angular/common';
import { TagDataService } from '../../data/tag-data.service';
import { TaskDataService, Task } from '../../data/task-data.service';
import { TaskCardComponent } from '../app-shell/task-card.component';
import { AppViewStateService } from '../app-shell/app-view-state.service';

@Component({
  selector: 'app-tag-view',
  standalone: true,
  imports: [NgIf, NgFor, UpperCasePipe, TaskCardComponent],
  templateUrl: './tag-view.component.html',
  styleUrl: './tag-view.component.css',
})
export class TagViewComponent {
  private readonly tagsService = inject(TagDataService);
  private readonly tasksService = inject(TaskDataService);
  private readonly viewState = inject(AppViewStateService);

  readonly tags = computed(() => this.tagsService.list());
  readonly tasks = computed(() => this.tasksService.list());
  readonly searchTerm = this.viewState.searchTerm;

  readonly selectedTags = signal<Set<string>>(new Set());
  readonly includeCompleted = signal(false);
  readonly showUntagged = signal(false);
   // OR = zadanie pasuje do przynajmniej jednego zaznaczonego taga; AND = do wszystkich.
  readonly matchMode = signal<'or' | 'and'>('or');
  readonly sortOption = signal<
    | 'priority-desc'
    | 'priority-asc'
    | 'due-asc'
    | 'due-desc'
    | 'created-asc'
    | 'created-desc'
    | 'alpha-asc'
    | 'alpha-desc'
  >('priority-desc');
  readonly pageSize = 20;
  readonly visibleCount = signal(this.pageSize);

  readonly tagCounts = computed(() => {
    const counts = new Map<string, number>();
    for (const task of this.tasks()) {
      const ids = task.tags ?? [];
      if (!ids.length) continue;
      for (const id of ids) {
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }
    return counts;
  });

  readonly filteredTasks = computed(() => {
    const selected = this.selectedTags();
    const showUntagged = this.showUntagged();
    const includeCompleted = this.includeCompleted();
    const matchMode = this.matchMode();

    const normalizedSearch = this.searchTerm().trim().toLowerCase();
    let list: Task[] = this.tasks();
    if (normalizedSearch) {
      list = list.filter(
        (task) =>
          task.name.toLowerCase().includes(normalizedSearch) ||
          (task.description ?? '').toLowerCase().includes(normalizedSearch)
      );
    }
    if (!includeCompleted) {
      list = list.filter((task) => !task.isDone);
    }
    if (showUntagged) {
      list = list.filter((task) => !task.tags.length);
    } else if (selected.size) {
      list = list.filter((task) =>
        matchMode === 'or'
          ? task.tags.some((id) => selected.has(id))
          : selected.size > 0 &&
            [...selected].every((id) => task.tags.includes(id))
      );
    }
    return this.sortTasks(list);
  });

  readonly visibleTasks = computed(() =>
    this.filteredTasks().slice(0, this.visibleCount())
  );

  toggleTag(tagId: string): void {
    this.showUntaghedOff();
    this.visibleCount.set(this.pageSize);
    this.selectedTags.update((current) => {
      const next = new Set(current);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  }

  clearSelection(): void {
    this.selectedTags.set(new Set());
    this.showUntagged.set(false);
    this.visibleCount.set(this.pageSize);
  }

  showAllTasks(): void {
    this.clearSelection();
  }

  showTasksWithoutTags(): void {
    this.selectedTags.set(new Set());
    this.showUntagged.set(true);
    this.visibleCount.set(this.pageSize);
  }

  toggleCompleted(): void {
    this.includeCompleted.update((v) => !v);
    this.visibleCount.set(this.pageSize);
  }

  loadMore(): void {
    const next = this.visibleCount() + this.pageSize;
    this.visibleCount.set(next);
  }

  tagCount(tagId: string): number {
    return this.tagCounts().get(tagId) ?? 0;
  }

  setMatchMode(mode: 'or' | 'and'): void {
    this.matchMode.set(mode);
    this.showUntagged.set(false);
    this.visibleCount.set(this.pageSize);
  }

  setSort(
    option:
      | 'priority-desc'
      | 'priority-asc'
      | 'due-asc'
      | 'due-desc'
      | 'created-asc'
      | 'created-desc'
      | 'alpha-asc'
      | 'alpha-desc'
  ): void {
    this.sortOption.set(option);
    this.visibleCount.set(this.pageSize);
  }

  trackTask(_index: number, task: Task): string {
    return task.id;
  }

  private sortTasks(tasks: Task[]): Task[] {
    const option = this.sortOption();
    const byString = (a: string, b: string) => a.localeCompare(b);
    return [...tasks].sort((a, b) => {
      switch (option) {
        case 'priority-asc':
          return byString(a.priority ?? '', b.priority ?? '');
        case 'priority-desc':
          return byString(b.priority ?? '', a.priority ?? '');
        case 'due-asc':
          return (
            (a.finishDate ? new Date(a.finishDate).getTime() : Infinity) -
            (b.finishDate ? new Date(b.finishDate).getTime() : Infinity)
          );
        case 'due-desc':
          return (
            (b.finishDate ? new Date(b.finishDate).getTime() : -Infinity) -
            (a.finishDate ? new Date(a.finishDate).getTime() : -Infinity)
          );
        case 'created-asc':
          return (
            (a.createdAt ? new Date(a.createdAt).getTime() : 0) -
            (b.createdAt ? new Date(b.createdAt).getTime() : 0)
          );
        case 'created-desc':
          return (
            (b.createdAt ? new Date(b.createdAt).getTime() : 0) -
            (a.createdAt ? new Date(a.createdAt).getTime() : 0)
          );
        case 'alpha-asc':
          return byString(a.name.toLowerCase(), b.name.toLowerCase());
        case 'alpha-desc':
          return byString(b.name.toLowerCase(), a.name.toLowerCase());
        default:
          return 0;
      }
    });
  }

  private showUntaghedOff(): void {
    this.showUntagged.set(false);
  }
}
