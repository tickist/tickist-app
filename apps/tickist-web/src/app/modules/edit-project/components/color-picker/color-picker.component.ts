import { Component, forwardRef, Input } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { ExtendedModule } from "@ngbracket/ngx-layout/extended";
import { NgFor, NgClass, NgStyle } from "@angular/common";
import { FlexModule } from "@ngbracket/ngx-layout/flex";

const noop = () => {};

@Component({
    selector: "tickist-color-picker",
    templateUrl: "./color-picker.html",
    styleUrls: ["./color-picker.scss"],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ColorPickerComponent),
            multi: true,
        },
    ],
    standalone: true,
    imports: [
        FlexModule,
        NgFor,
        NgClass,
        ExtendedModule,
        FaIconComponent,
        NgStyle,
    ],
})
export class ColorPickerComponent implements ControlValueAccessor {
    @Input() colors;

    // The internal data model
    innerValue: any = "";

    // Placeholders for the callbacks which are later providesd
    // by the Control Value Accessor
    private onTouchedCallback: () => void = noop;
    private onChangeCallback: (_: any) => void = noop;

    // get accessor
    get value(): any {
        return this.innerValue;
    }

    // set accessor including call the onchange callback
    set value(v: any) {
        if (v !== this.innerValue) {
            this.innerValue = v;
            this.onChangeCallback(v);
        }
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
