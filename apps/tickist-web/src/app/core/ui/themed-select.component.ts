import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  Output,
  ViewChild,
  ViewChildren,
  QueryList,
  inject,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type ThemedSelectValue = string | number | boolean;
export type ThemedSelectOption = {
  value: ThemedSelectValue;
  label: string;
};

type MenuLayout = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

let nextSelectId = 0;

@Component({
  selector: 'app-themed-select',
  templateUrl: './themed-select.component.html',
  styleUrl: './themed-select.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ThemedSelectComponent),
      multi: true,
    },
  ],
  host: {
    '(document:mousedown)': 'onDocumentMouseDown($event)',
    '(document:keydown.escape)': 'onDocumentEscape()',
    '(window:resize)': 'close()',
  },
})
export class ThemedSelectComponent implements ControlValueAccessor {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly instanceId = nextSelectId++;
  private readonly onScroll = (event: Event) => {
    if (!this.host.nativeElement.contains(event.target as Node)) this.close();
  };
  private onChange: (value: ThemedSelectValue) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  @Input() options: readonly ThemedSelectOption[] = [];
  @Input() ariaLabel = 'Select option';
  @Input() controlId = '';
  @Input() compact = false;
  @Input() disabled = false;
  @Input() set value(value: ThemedSelectValue) {
    this.selectedValue.set(value);
  }
  @Output() readonly valueChange = new EventEmitter<ThemedSelectValue>();

  @ViewChild('trigger') private trigger?: ElementRef<HTMLButtonElement>;
  @ViewChildren('optionButton')
  private optionButtons?: QueryList<ElementRef<HTMLButtonElement>>;

  readonly selectedValue = signal<ThemedSelectValue>('');
  readonly formDisabled = signal(false);
  readonly open = signal(false);
  readonly activeIndex = signal(0);
  readonly layout = signal<MenuLayout>({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 240,
  });
  readonly listboxId = `themed-select-${this.instanceId}`;

  constructor() {
    this.destroyRef.onDestroy(() =>
      document.removeEventListener('scroll', this.onScroll, true)
    );
  }

  selectedLabel(): string {
    return (
      this.options.find((option) => option.value === this.selectedValue())
        ?.label ??
      this.options[0]?.label ??
      ''
    );
  }

  isDisabled(): boolean {
    return this.disabled || this.formDisabled();
  }

  writeValue(value: ThemedSelectValue): void {
    this.selectedValue.set(value);
  }

  registerOnChange(callback: (value: ThemedSelectValue) => void): void {
    this.onChange = callback;
  }

  registerOnTouched(callback: () => void): void {
    this.onTouched = callback;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
    if (disabled) this.close();
  }

  toggle(): void {
    if (this.isDisabled()) return;
    if (this.open()) {
      this.close();
    } else {
      this.show();
    }
  }

  show(focusLast = false): void {
    if (this.isDisabled() || !this.options.length) return;
    const rect = this.trigger?.nativeElement.getBoundingClientRect();
    if (!rect) return;

    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const menuHeight = Math.min(240, this.options.length * 42 + 12);
    const above =
      spaceBelow < Math.min(menuHeight, 160) && spaceAbove > spaceBelow;
    const maxHeight = Math.max(
      80,
      Math.min(240, above ? spaceAbove : spaceBelow)
    );
    this.layout.set({
      top: above
        ? Math.max(8, rect.top - Math.min(menuHeight, maxHeight) - 4)
        : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      maxHeight,
    });
    const selectedIndex = this.options.findIndex(
      (option) => option.value === this.selectedValue()
    );
    this.activeIndex.set(
      focusLast ? this.options.length - 1 : Math.max(0, selectedIndex)
    );
    this.open.set(true);
    document.addEventListener('scroll', this.onScroll, true);
    requestAnimationFrame(() => this.focusActiveOption());
  }

  close(restoreFocus = false): void {
    if (!this.open()) return;
    this.open.set(false);
    document.removeEventListener('scroll', this.onScroll, true);
    if (restoreFocus) this.trigger?.nativeElement.focus();
  }

  choose(option: ThemedSelectOption): void {
    this.selectedValue.set(option.value);
    this.onChange(option.value);
    this.valueChange.emit(option.value);
    this.onTouched();
    this.close(true);
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.show(event.key === 'ArrowUp');
    }
  }

  onOptionKeydown(event: KeyboardEvent, index: number): void {
    let next = index;
    switch (event.key) {
      case 'ArrowDown':
        next = (index + 1) % this.options.length;
        break;
      case 'ArrowUp':
        next = (index - 1 + this.options.length) % this.options.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = this.options.length - 1;
        break;
      case 'Escape':
        event.preventDefault();
        this.close(true);
        return;
      default:
        return;
    }
    event.preventDefault();
    this.activeIndex.set(next);
    this.focusActiveOption();
  }

  onFocusOut(event: FocusEvent): void {
    if (!this.host.nativeElement.contains(event.relatedTarget as Node | null)) {
      this.onTouched();
      this.close();
    }
  }

  onDocumentMouseDown(event: MouseEvent): void {
    if (
      this.open() &&
      !this.host.nativeElement.contains(event.target as Node)
    ) {
      this.close();
    }
  }

  onDocumentEscape(): void {
    this.close();
  }

  private focusActiveOption(): void {
    this.optionButtons?.get(this.activeIndex())?.nativeElement.focus();
  }
}
