import { ChangeDetectionStrategy, Component, EventEmitter, OnDestroy, OnInit, Output } from "@angular/core";
import { UntypedFormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import { selectActiveDate } from "../../../../core/selectors/active-date.selectors";
import { Store } from "@ngrx/store";
import { IActiveDateElement } from "@data/active-data-element.interface";
import { StateActiveDateElement } from "@data/state-active-date-element.enum";
import { differenceInDays, format, isDate } from "date-fns";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";

@Component({
    selector: "tickist-choose-day",
    templateUrl: "./choose-day.component.html",
    styleUrls: ["./choose-day.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        MatFormFieldModule,
        MatInputModule,
        FormsModule,
        MatDatepickerModule,
        ReactiveFormsModule,
    ],
})
export class ChooseDayComponent implements OnInit, OnDestroy {
    @Output() selectedDate = new EventEmitter();
    selectedDateFormControl: UntypedFormControl;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(private store: Store) {}

    ngOnInit() {
        this.selectedDateFormControl = new UntypedFormControl({
            value: "",
            disabled: true,
        });
        this.store
            .select(selectActiveDate)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((activeDateElement: IActiveDateElement) => {
                if (activeDateElement.state === StateActiveDateElement.future) {
                    this.selectedDateFormControl.setValue("");
                } else if (activeDateElement.state === StateActiveDateElement.weekdays) {
                    const today = new Date();
                    const diffAbsTodaySelectedDate = this.selectedDateFormControl.value
                        ? differenceInDays(today, this.selectedDateFormControl.value)
                        : 0;
                    if (diffAbsTodaySelectedDate < 7) {
                        this.selectedDateFormControl.setValue("");
                    }
                    const diffAbsTodayActiveDay = differenceInDays(today, activeDateElement.date);
                    if (diffAbsTodayActiveDay > 7 && isDate(activeDateElement.date)) {
                        this.selectedDateFormControl.setValue(activeDateElement.date);
                    }
                }
            });
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    emitOnSelectedDate() {
        if (this.selectedDateFormControl.value) {
            this.selectedDate.emit(format(this.selectedDateFormControl.value, "dd-MM-yyyy"));
        }
    }
}
