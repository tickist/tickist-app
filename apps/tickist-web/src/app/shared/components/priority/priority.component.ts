import { Component, EventEmitter, forwardRef, Input, Output } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { ExtendedModule } from "@ngbracket/ngx-layout/extended";
import { NgStyle } from "@angular/common";
import { MatButtonToggleModule } from "@angular/material/button-toggle";

const noop = () => {};

@Component({
    selector: "tickist-priority",
    templateUrl: "./priority.component.html",
    styleUrls: ["./priority.component.scss"],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => PriorityComponent),
            multi: true,
        },
    ],
    standalone: true,
    imports: [MatButtonToggleModule, NgStyle, ExtendedModule],
})
export class PriorityComponent implements ControlValueAccessor {
    @Output() changePriority = new EventEmitter();
    innerValue: any = "";

    // The internal data model

    // Placeholders for the callbacks which are later providesd
    // by the Control Value Accessor
    private onTouchedCallback: () => void = noop;
    private onChangeCallback: (_: any) => void = noop;

    // get accessor

    constructor() {}

    get manualValue() {
        return this.innerValue;
    }

    @Input() set manualValue(manualValue) {
        this.innerValue = manualValue;
    }

    // eslint-disable-next-line @typescript-eslint/member-ordering
    get value(): any {
        return this.innerValue;
    }

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

    change($event) {
        this.innerValue = $event.value;
        this.changePriority.emit($event.value);
        this.writeValue($event.value);
        this.onChangeCallback($event.value);
    }

    onClickChangePriority(priority) {
        this.changePriority.emit(priority);
    }
}
