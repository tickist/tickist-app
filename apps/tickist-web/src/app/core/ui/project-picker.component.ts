import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
  inject,
  signal,
} from '@angular/core';
import { ProjectIconComponent } from './project-icon.component';

export interface ProjectPickerItem {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
}

type PickerOption = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
};

@Component({
  selector: 'app-project-picker',
  standalone: true,
  imports: [ProjectIconComponent],
  templateUrl: './project-picker.component.html',
  styleUrl: './project-picker.component.css',
})
export class ProjectPickerComponent {
  private readonly host = inject(ElementRef<HTMLElement>);

  @Input() projects: ReadonlyArray<ProjectPickerItem> = [];
  @Input() selectedProjectId = '';
  @Input() emptyOptionLabel = 'Inbox';
  @Input() emptyOptionIcon: string | null = 'inbox';
  @Input() includeEmptyOption = true;
  @Input() disabled = false;
  @Input() ariaLabel = 'Select project';

  @Output() readonly selectedProjectIdChange = new EventEmitter<string>();

  @ViewChild('triggerButton')
  private triggerButton?: ElementRef<HTMLButtonElement>;
  @ViewChildren('optionButton')
  private optionButtons?: QueryList<ElementRef<HTMLButtonElement>>;

  readonly isOpen = signal(false);
  readonly activeIndex = signal(0);

  options(): PickerOption[] {
    const options: PickerOption[] = [];
    if (this.includeEmptyOption) {
      options.push({
        id: '',
        name: this.emptyOptionLabel,
        icon: this.emptyOptionIcon,
        color: null,
      });
    }
    for (const project of this.projects) {
      options.push({
        id: project.id,
        name: project.name,
        icon: project.icon ?? null,
        color: project.color ?? null,
      });
    }
    return options;
  }

  selectedOption(): PickerOption {
    return (
      this.options().find((option) => option.id === this.selectedProjectId) ??
      this.options()[0] ?? {
        id: '',
        name: this.emptyOptionLabel,
        icon: this.emptyOptionIcon,
        color: null,
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
      this.open(false);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.open(true);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggle();
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

  optionId(index: number): string {
    return `project-picker-option-${index}`;
  }

  @HostListener('document:mousedown', ['$event'])
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

  private open(preferLast = false): void {
    if (!this.options().length) {
      return;
    }
    this.isOpen.set(true);
    const selectedIndex = this.options().findIndex(
      (option) => option.id === this.selectedProjectId
    );
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
}
