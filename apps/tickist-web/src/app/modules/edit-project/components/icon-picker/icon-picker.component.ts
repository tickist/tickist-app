import { Component, forwardRef, Input, OnDestroy } from "@angular/core";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR, UntypedFormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { noop, Subject } from "rxjs";
import { debounceTime, distinctUntilChanged, takeUntil } from "rxjs/operators";
import { FilterPipe } from "../../pipes/filter.pipe";
import { FlexModule } from "@ngbracket/ngx-layout/flex";
import { CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf } from "@angular/cdk/scrolling";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatInputModule } from "@angular/material/input";
import { ExtendedModule } from "@ngbracket/ngx-layout/extended";
import { NgStyle, NgFor, NgClass } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";

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
    standalone: true,
    imports: [
        MatFormFieldModule,
        NgStyle,
        ExtendedModule,
        MatInputModule,
        FormsModule,
        ReactiveFormsModule,
        FaIconComponent,
        CdkVirtualScrollViewport,
        CdkFixedSizeVirtualScroll,
        CdkVirtualForOf,
        FlexModule,
        NgFor,
        NgClass,
        FilterPipe,
    ],
})
export class IconPickerComponent implements ControlValueAccessor, OnDestroy {
    @Input() color: string;
    iconDefinitions: Array<IconDefinition> = [];
    iconDefinitionsGroups: Array<Array<IconDefinition>> = [];
    size = 4;

    searchText: string;
    searchControl: UntypedFormControl;

    innerValue: any = "";
    private onTouchedCallback: () => void = noop;
    private onChangeCallback: (_: any) => void = noop;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor() {
        this.iconDefinitions = this.iconDefinitions.concat(Object.values(fab));
        this.iconDefinitions = this.iconDefinitions.concat(Object.values(far));
        this.iconDefinitions = this.iconDefinitions.concat(Object.values(fas));
        this.iconDefinitionsGroups = [];
        while (this.iconDefinitions.length > 0) {
            this.iconDefinitionsGroups.push(this.iconDefinitions.splice(0, this.size));
        }
        this.searchControl = new UntypedFormControl("");
        this.searchControl.valueChanges
            .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.ngUnsubscribe))
            .subscribe((value) => {
                this.searchText = value;
            });
    }

    get value(): any {
        return this.innerValue;
    }

    set value(v: any) {
        if (v !== this.innerValue) {
            this.innerValue = v;
            this.onChangeCallback(v);
        }
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
