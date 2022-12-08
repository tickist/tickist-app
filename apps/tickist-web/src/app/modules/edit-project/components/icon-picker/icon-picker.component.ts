import { Component, forwardRef, Input, OnDestroy } from "@angular/core";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
    ControlValueAccessor,
    UntypedFormControl,
    NG_VALUE_ACCESSOR,
} from "@angular/forms";
import { noop, Subject } from "rxjs";
import { debounceTime, distinctUntilChanged, takeUntil } from "rxjs/operators";

@Component({
    selector: "tickist-icon-picker",
    templateUrl: "./icon-picker.component.html",
    styleUrls: ["./icon-picker.component.scss"],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => IconPickerComponent),
            multi: true,
        },
    ],
})
export class IconPickerComponent implements ControlValueAccessor, OnDestroy {
    iconDefinitions: Array<IconDefinition> = [];
    iconDefinitionsGroups: Array<Array<IconDefinition>> = [];
    size = 4;
    @Input() color: string;
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    searchText: string;
    searchControl: UntypedFormControl;

    innerValue: any = "";
    private onTouchedCallback: () => void = noop;
    private onChangeCallback: (_: any) => void = noop;

    get value(): any {
        return this.innerValue;
    }

    set value(v: any) {
        if (v !== this.innerValue) {
            this.innerValue = v;
            this.onChangeCallback(v);
        }
    }

    constructor() {
        this.iconDefinitions = this.iconDefinitions.concat(Object.values(fab));
        this.iconDefinitions = this.iconDefinitions.concat(Object.values(far));
        this.iconDefinitions = this.iconDefinitions.concat(Object.values(fas));
        this.iconDefinitionsGroups = [];
        while (this.iconDefinitions.length > 0) {
            this.iconDefinitionsGroups.push(
                this.iconDefinitions.splice(0, this.size)
            );
        }
        this.searchControl = new UntypedFormControl("");
        this.searchControl.valueChanges
            .pipe(
                debounceTime(400),
                distinctUntilChanged(),
                takeUntil(this.ngUnsubscribe)
            )
            .subscribe((value) => {
                this.searchText = value;
            });
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    writeValue(value: any) {
        if (value !== this.innerValue) {
            this.innerValue = value;
        }
    }

    registerOnChange(fn: any) {
        this.onChangeCallback = fn;
    }

    registerOnTouched(fn: any) {
        this.onTouchedCallback = fn;
    }

    changeIcon(icon) {
        this.innerValue = [icon.prefix, icon.iconName];
        this.onChangeCallback([icon.prefix, icon.iconName]);
    }
}
