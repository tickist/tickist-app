import {Component, EventEmitter, forwardRef, Input, Output} from '@angular/core';
import {NG_VALUE_ACCESSOR, ControlValueAccessor} from '@angular/forms';


const noop = () => {
};


@Component({
    selector: 'tickist-priority',
    templateUrl: './priority.component.html',
    styleUrls: ['./priority.component.scss'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => PriorityComponent),
        multi: true
    }]
})
export class PriorityComponent implements ControlValueAccessor {
    @Output() change = new EventEmitter();

    @Input('manualValue') set manualValue(manualValue) {
        this.innerValue = manualValue;
    }
    get manualValue() {
        return this.innerValue;
    }

    // The internal data model
    innerValue: any = '';

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

    constructor() {}

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

    changePriority($event) {
        this.innerValue = $event.value;
        this.change.emit($event.value);
        this.writeValue($event.value);
        this.onChangeCallback($event.value);

    }

    onClickChangePriority(priority) {
         this.change.emit(priority);
    }


}
