import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { Project } from '../../data/project-data.service';

type SortOption =
  | 'priority-desc'
  | 'priority-asc'
  | 'due-asc'
  | 'due-desc'
  | 'created-asc'
  | 'created-desc'
  | 'alpha-asc'
  | 'alpha-desc';

type FilterOption = 'all' | 'done' | 'not-done';

@Component({
  selector: 'app-project-header',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './project-header.component.html',
  styleUrl: './project-header.component.css',
})
export class ProjectHeaderComponent {
  @Input({ required: true }) project!: Project;
  @Input() viewMode: 'extended' | 'simple' = 'extended';
  @Input() sort: SortOption = 'priority-desc';
  @Input() filter: FilterOption = 'not-done';

  @Output() toggleSimple = new EventEmitter<boolean>();
  @Output() openEdit = new EventEmitter<void>();
  @Output() changeSort = new EventEmitter<SortOption>();
  @Output() changeFilter = new EventEmitter<FilterOption>();

  readonly sortOpen = signal(false);
  readonly filterOpen = signal(false);

  readonly sortOptions: { label: string; value: SortOption }[] = [
    { label: 'priority ↓', value: 'priority-desc' },
    { label: 'priority ↑', value: 'priority-asc' },
    { label: 'due date ↑', value: 'due-asc' },
    { label: 'due date ↓', value: 'due-desc' },
    { label: 'creation date ↑', value: 'created-asc' },
    { label: 'creation date ↓', value: 'created-desc' },
    { label: 'A-Z ↑', value: 'alpha-asc' },
    { label: 'A-Z ↓', value: 'alpha-desc' },
  ];

  readonly filterOptions: { label: string; value: FilterOption }[] = [
    { label: 'all tasks', value: 'all' },
    { label: 'not done', value: 'not-done' },
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
