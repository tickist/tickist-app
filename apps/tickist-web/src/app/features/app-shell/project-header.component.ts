import { formatMinutesShort } from '../../core/time/duration';
import { IconComponent } from '../../core/ui/icon.component';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';

import { Project } from '../../data/project-data.service';
import { ProjectIconComponent } from '../../core/ui/project-icon.component';
import { type ProjectSortOption as SortOption } from './project-sort';

type FilterOption = 'all' | 'done' | 'not-done' | 'suspended';

@Component({
  selector: 'app-project-header',
  standalone: true,
  imports: [IconComponent, ProjectIconComponent],
  templateUrl: './project-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './project-header.component.css',
})
export class ProjectHeaderComponent {
  @Input({ required: true }) project!: Project;
  @Input() viewMode: 'extended' | 'simple' = 'extended';
  @Input() sort: SortOption = 'priority-desc';
  @Input() filter: FilterOption = 'not-done';
  @Input() suspendedCount = 0;
  /** Total time logged on the project's tasks, in minutes. */
  @Input() spentMinutes = 0;
  /** Total estimate of the project's tasks, in minutes. */
  @Input() estimateMinutes = 0;

  @Output() toggleSimple = new EventEmitter<boolean>();
  @Output() openEdit = new EventEmitter<void>();
  @Output() changeSort = new EventEmitter<SortOption>();
  @Output() changeFilter = new EventEmitter<FilterOption>();

  readonly sortOpen = signal(false);

  hasTime(): boolean {
    return this.spentMinutes > 0 || this.estimateMinutes > 0;
  }

  timeLabel(): string {
    const spent = formatMinutesShort(this.spentMinutes);

    if (this.estimateMinutes <= 0) return `${spent} spent`;

    return `${spent} spent of ${formatMinutesShort(
      this.estimateMinutes
    )} estimated`;
  }

  /** Share of the estimate already spent; null when nothing is estimated. */
  timePercent(): number | null {
    if (this.estimateMinutes <= 0) return null;

    return Math.round((this.spentMinutes / this.estimateMinutes) * 100);
  }

  readonly filterOpen = signal(false);

  readonly sortOptions: { label: string; value: SortOption }[] = [
    { label: 'priority ↓', value: 'priority-desc' },
    { label: 'priority ↑', value: 'priority-asc' },
    { label: 'due date ↑', value: 'due-asc' },
    { label: 'due date ↓', value: 'due-desc' },
    { label: 'creation date ↑', value: 'created-asc' },
    { label: 'creation date ↓', value: 'created-desc' },
    { label: 'modification date ↑', value: 'modified-asc' },
    { label: 'modification date ↓', value: 'modified-desc' },
    { label: 'A-Z ↑', value: 'alpha-asc' },
    { label: 'A-Z ↓', value: 'alpha-desc' },
  ];

  readonly filterOptions: { label: string; value: FilterOption }[] = [
    { label: 'all tasks', value: 'all' },
    { label: 'not done', value: 'not-done' },
    { label: 'suspended', value: 'suspended' },
    { label: 'done', value: 'done' },
  ];

  selectSort(option: SortOption): void {
    this.changeSort.emit(option);
    this.sortOpen.set(false);
  }

  selectFilter(option: FilterOption): void {
    this.changeFilter.emit(option);
    this.filterOpen.set(false);
  }
}
