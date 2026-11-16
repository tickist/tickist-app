import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type ThemedSelectValue = string | number | boolean;

export type ThemedSelectOption = {
  value: ThemedSelectValue;
  label: string;
};

/**
 * Native <select> styled with `appearance: base-select` where supported
 * (picker, focus, keyboard and accessibility come from the browser). Other
 * browsers show the platform dropdown. Option values may be booleans or
 * numbers, so the native control carries option indexes and this component
 * maps them back to the typed values.
 */
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
})
export class ThemedSelectComponent implements ControlValueAccessor {
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

  readonly selectedValue = signal<ThemedSelectValue>('');
  readonly formDisabled = signal(false);

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
  }

  onSelectChange(index: number): void {
    const option = this.options[index];

    if (!option) return;
    this.selectedValue.set(option.value);
    this.onChange(option.value);
    this.valueChange.emit(option.value);
    this.onTouched();
  }

  onBlur(): void {
    this.onTouched();
  }
}
