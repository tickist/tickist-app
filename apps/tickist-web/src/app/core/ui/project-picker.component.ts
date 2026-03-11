import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
  inject,
  signal,
} from '@angular/core';
import {
  buildHierarchy,
  filterHierarchy,
  flattenHierarchy,
} from '../projects/project-tree';
import { ProjectIconComponent } from './project-icon.component';

export interface ProjectPickerItem {
  id: string;
  name: string;
  ancestorId?: string | null;
  isInbox?: boolean;
  projectType?: string | null;
  icon?: string | null;
  color?: string | null;
}

type PickerGroupKey = 'inbox' | 'active' | 'someday' | 'routine';

type PickerOption = {
  id: string;
  name: string;
  ancestorId: string | null;
  groupKey: PickerGroupKey;
  icon: string | null;
  color: string | null;
  level: number;
  index: number;
  parentLabel: string | null;
};

type MenuLayout = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

type PickerGroup = {
  key: PickerGroupKey;
  label: string | null;
  options: PickerOption[];
};

let nextProjectPickerId = 0;

const PICKER_GROUP_LABELS: Record<PickerGroupKey, string> = {
  inbox: 'Inbox',
  active: 'Active',
  someday: 'Someday / Maybe',
  routine: 'Routine reminder',
};

@Component({
  selector: 'app-project-picker',
  imports: [ProjectIconComponent],
  templateUrl: './project-picker.component.html',
  styleUrl: './project-picker.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:mousedown)': 'handleOutsideClick($event)',
    '(document:keydown.escape)': 'handleEscapeKey()',
    '(window:resize)': 'handleViewportChange()',
    '(window:scroll)': 'handleViewportChange()',
  },
})
export class ProjectPickerComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly instanceId = nextProjectPickerId++;

  @Input() projects: ReadonlyArray<ProjectPickerItem> = [];
  @Input() selectedProjectId = '';
  @Input() emptyOptionLabel = 'Inbox';
  @Input() emptyOptionIcon: string | null = 'inbox';
  @Input() includeEmptyOption = true;
  @Input() disabled = false;
  @Input() ariaLabel = 'Select project';
  @Input() searchPlaceholder = 'Search projects';

  @Output() readonly selectedProjectIdChange = new EventEmitter<string>();

  @ViewChild('triggerButton')
  private triggerButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('searchInput')
  private searchInput?: ElementRef<HTMLInputElement>;
  @ViewChildren('optionButton')
  private optionButtons?: QueryList<ElementRef<HTMLButtonElement>>;

  readonly isOpen = signal(false);
  readonly activeIndex = signal(0);
  readonly searchQuery = signal('');
  readonly menuLayout = signal<MenuLayout>({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 260,
  });

  options(): PickerOption[] {
    return this.groupedOptions().flatMap((group) => group.options);
  }

  groupedOptions(): PickerGroup[] {
    const query = this.searchQuery().trim();
    const groups = new Map<PickerGroupKey, PickerOption[]>(
      (['inbox', 'active', 'someday', 'routine'] as const).map((key) => [
        key,
        [],
      ])
    );

    let index = 0;
    if (!query || this.matchesSearch(this.emptyOptionLabel)) {
      if (this.includeEmptyOption) {
        groups.get('inbox')?.push({
          id: '',
          name: this.emptyOptionLabel,
          ancestorId: null,
          groupKey: 'inbox',
          icon: this.emptyOptionIcon,
          color: null,
          level: 0,
          index,
          parentLabel: null,
        });
        index += 1;
      }
    }

    const projectOptions = this.buildProjectOptions(query);
    for (const option of projectOptions) {
      groups.get(option.groupKey)?.push({
        ...option,
        index,
      });
      index += 1;
    }

    return (['inbox', 'active', 'someday', 'routine'] as const)
      .map((key) => ({
        key,
        label: this.groupLabel(key, groups.get(key) ?? []),
        options: groups.get(key) ?? [],
      }))
      .filter((group) => group.options.length > 0);
  }

  selectedOption(): PickerOption {
    return (
      this.allOptions().find((option) => option.id === this.selectedProjectId) ??
      this.allOptions()[0] ?? {
        id: '',
        name: this.emptyOptionLabel,
        ancestorId: null,
        groupKey: 'inbox',
        icon: this.emptyOptionIcon,
        color: null,
        level: 0,
        index: 0,
        parentLabel: null,
      }
    );
  }

  toggle(): void {
    if (this.disabled) {
      return;
    }
    if (this.isOpen()) {
      this.close(true);
      return;
    }
    this.open();
  }

  selectOption(optionId: string): void {
    this.selectedProjectIdChange.emit(optionId);
    this.close(true);
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    if (this.disabled) {
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.open(false, false);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.open(true, false);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (this.isOpen()) {
        this.close(true);
      } else {
        this.open(false, true);
      }
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close(true);
    }
  }

  onOptionKeydown(event: KeyboardEvent, index: number): void {
    const total = this.options().length;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.focusIndex((index + 1) % total);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.focusIndex((index - 1 + total) % total);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      this.focusIndex(0);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      this.focusIndex(total - 1);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close(true);
    }
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    const options = this.options();
    if (!options.length) {
      this.activeIndex.set(0);
      return;
    }

    const selectedIndex = options.findIndex(
      (option) => option.id === this.selectedProjectId
    );
    this.activeIndex.set(selectedIndex >= 0 ? selectedIndex : 0);
  }

  onSearchKeydown(event: KeyboardEvent): void {
    const total = this.options().length;
    if (!total) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.close(true);
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.focusIndex(0);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.focusIndex(total - 1);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close(true);
    }
  }

  optionId(index: number): string {
    return `project-picker-${this.instanceId}-option-${index}`;
  }

  handleOutsideClick(event: MouseEvent): void {
    if (!this.isOpen()) {
      return;
    }
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }
    if (!this.host.nativeElement.contains(target)) {
      this.close(false);
    }
  }

  handleEscapeKey(): void {
    this.close(true);
  }

  handleViewportChange(): void {
    if (!this.isOpen()) {
      return;
    }
    this.positionMenu();
  }

  hasVisibleOptions(): boolean {
    return this.options().length > 0;
  }

  optionIndent(level: number): number {
    return 0.7 + level * 1.15;
  }

  private open(preferLast = false, focusSearch = true): void {
    if (!this.options().length) {
      return;
    }
    this.isOpen.set(true);
    this.searchQuery.set('');
    this.positionMenu();
    const selectedIndex = this.options().findIndex(
      (option) => option.id === this.selectedProjectId
    );
    if (focusSearch) {
      this.activeIndex.set(selectedIndex >= 0 ? selectedIndex : 0);
      queueMicrotask(() => {
        this.positionMenu();
        this.searchInput?.nativeElement.focus();
      });
      return;
    }
    if (selectedIndex >= 0) {
      this.focusIndex(selectedIndex);
      return;
    }
    this.focusIndex(preferLast ? this.options().length - 1 : 0);
  }

  private close(focusTrigger: boolean): void {
    if (!this.isOpen()) {
      return;
    }
    this.isOpen.set(false);
    this.searchQuery.set('');
    if (focusTrigger) {
      queueMicrotask(() => this.triggerButton?.nativeElement.focus());
    }
  }

  private focusIndex(index: number): void {
    if (!this.options().length) {
      return;
    }
    const safeIndex = Math.max(0, Math.min(index, this.options().length - 1));
    this.activeIndex.set(safeIndex);
    queueMicrotask(() =>
      this.optionButtons?.get(safeIndex)?.nativeElement.focus()
    );
  }

  private positionMenu(): void {
    const trigger = this.triggerButton?.nativeElement;
    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gutter = 12;
    const desiredWidth = rect.width;
    const width = Math.max(
      220,
      Math.min(desiredWidth, viewportWidth - gutter * 2)
    );
    const left = Math.min(
      Math.max(gutter, rect.left),
      viewportWidth - width - gutter
    );
    const belowTop = rect.bottom + 6;
    const belowSpace = viewportHeight - belowTop - gutter;
    const aboveSpace = rect.top - gutter;
    const shouldOpenAbove = belowSpace < 220 && aboveSpace > belowSpace;
    const maxHeight = Math.min(
      260,
      Math.max(180, shouldOpenAbove ? aboveSpace : belowSpace)
    );
    const top = shouldOpenAbove
      ? Math.max(gutter, rect.top - maxHeight - 6)
      : belowTop;

    this.menuLayout.set({
      top,
      left,
      width,
      maxHeight,
    });
  }

  private allOptions(): PickerOption[] {
    const options: PickerOption[] = [];
    if (this.includeEmptyOption) {
      options.push({
        id: '',
        name: this.emptyOptionLabel,
        ancestorId: null,
        groupKey: 'inbox',
        icon: this.emptyOptionIcon,
        color: null,
        level: 0,
        index: 0,
        parentLabel: null,
      });
    }
    const projectOptions = this.buildProjectOptions('');
    for (const project of projectOptions) {
      options.push({
        ...project,
        index: options.length,
      });
    }
    return options;
  }

  private matchesSearch(name: string): boolean {
    const query = this.searchQuery().trim().toLocaleLowerCase();
    if (!query) {
      return true;
    }
    return name.toLocaleLowerCase().includes(query);
  }

  private buildProjectOptions(query: string): Omit<PickerOption, 'index'>[] {
    const labelById = new Map(
      this.projects.map((project) => [project.id, project.name] as const)
    );
    const results: Omit<PickerOption, 'index'>[] = [];

    (['inbox', 'active', 'someday', 'routine'] as const).forEach((groupKey) => {
      const groupedProjects = this.projects.filter((project) => {
        if (this.includeEmptyOption && project.isInbox) {
          return false;
        }
        return this.projectGroupKey(project) === groupKey;
      });

      if (!groupedProjects.length) {
        return;
      }

      const projectTree = buildHierarchy(
        groupedProjects.map((project) => ({
          id: project.id,
          name: project.name,
          ancestorId: project.ancestorId ?? null,
          icon: project.icon ?? null,
          color: project.color ?? null,
          projectType: project.projectType ?? null,
          isInbox: project.isInbox ?? false,
        }))
      );
      const visibleTree = query
        ? filterHierarchy(
            projectTree,
            (project) => project.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
            true
          )
        : projectTree;

      flattenHierarchy(visibleTree).forEach((project) => {
        results.push({
          id: project.item.id,
          name: project.item.name,
          ancestorId: project.item.ancestorId,
          groupKey,
          icon: project.item.icon ?? null,
          color: project.item.color ?? null,
          level: project.level,
          parentLabel: project.parentIds.length
            ? project.parentIds
                .map((parentId) => labelById.get(parentId))
                .filter((parentName): parentName is string => !!parentName)
                .join(' / ')
            : null,
        });
      });
    });

    return results;
  }

  private projectGroupKey(project: ProjectPickerItem): PickerGroupKey {
    if (project.isInbox) {
      return 'inbox';
    }

    const type = (project.projectType ?? 'active').toLocaleLowerCase();
    if (type === 'routine') {
      return 'routine';
    }
    if (type === 'someday' || type === 'maybe') {
      return 'someday';
    }
    return 'active';
  }

  private groupLabel(
    key: PickerGroupKey,
    options: ReadonlyArray<PickerOption>
  ): string | null {
    if (!options.length) {
      return null;
    }
    if (
      key === 'inbox' &&
      options.length === 1 &&
      options[0]?.id === '' &&
      this.emptyOptionLabel !== 'Inbox'
    ) {
      return null;
    }
    return PICKER_GROUP_LABELS[key];
  }
}
