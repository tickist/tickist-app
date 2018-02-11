import {Component, forwardRef, Input} from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor} from '@angular/forms';


const noop = () => {
};

export const COLOR_PICKER_INPUT_CONTROL_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => ColorPickerComponent),
    multi: true
};

@Component({
  selector: 'color-picker',
  templateUrl: './color-picker.html',
  styleUrls: ['./color-picker.scss'],
  providers: [COLOR_PICKER_INPUT_CONTROL_VALUE_ACCESSOR]
})
export class ColorPickerComponent implements ControlValueAccessor  {

    @Input() colors;

    // The internal data model
    innerValue: any = '';

    // Placeholders for the callbacks which are later providesd
    // by the Control Value Accessor
    private onTouchedCallback: () => void = noop;
    private onChangeCallback: (_: any) => void = noop;

    // get accessor
    get value(): any {
        return this.innerValue;
    };

    // set accessor including call the onchange callback
    set value(v: any) {
        if (v !== this.innerValue) {
            this.innerValue = v;
            this.onChangeCallback(v);
        }
    }


  constructor() {
  }

  // From ControlValueAccessor interface
  writeValue(value: any) {
    if (value !== this.innerValue) {
          this.innerValue = value;
      }
  }

  // From ControlValueAccessor interface
  registerOnChange(fn: any) {
      this.onChangeCallback = fn;
  }

  // From ControlValueAccessor interface
  registerOnTouched(fn: any) {
      this.onTouchedCallback = fn;
  }

  changeColor(color) {
    this.innerValue = color;
    this.onChangeCallback(color);
  }


}
