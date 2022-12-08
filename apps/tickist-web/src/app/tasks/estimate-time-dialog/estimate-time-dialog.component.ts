import { Component, OnDestroy, OnInit } from "@angular/core";
import { MatLegacyDialogRef as MatDialogRef } from "@angular/material/legacy-dialog";
import { Observable, Subject } from "rxjs";
import {
    selectCurrentEstimateTimeFilter,
    selectEstimateTimeFilters,
} from "../../core/selectors/filters-tasks.selectors";
import { Store } from "@ngrx/store";
import { takeUntil } from "rxjs/operators";
import { Filter } from "@data/filter";
import { setCurrentEstimateTimeFiltersTasks } from "../../core/actions/tasks/estimate-time-filters-tasks.actions";

@Component({
    selector: "tickist-task-estimate-time-filter-dialog",
    styleUrls: ["./estimate-time-dialog.component.scss"],
    templateUrl: "./task-estimate-time-filter-dialog.html",
})
export class EstimateTimeDialogComponent implements OnInit, OnDestroy {
    estimateTimeCurrentFilter$: Observable<{
        currentFilterLt: Filter;
        currentFilterGt: Filter;
    }>;
    estimateTimeFilters$: Observable<{
        filtersLt: Filter[];
        filtersGt: Filter[];
    }>;
    filtersLt: Filter[];
    filtersGt: Filter[];
    rangeValues: number[];
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(
        public dialogRef: MatDialogRef<EstimateTimeDialogComponent>,
        private store: Store
    ) {}

    ngOnInit() {
        this.estimateTimeCurrentFilter$ = this.store.select(
            selectCurrentEstimateTimeFilter
        );
        this.estimateTimeFilters$ = this.store.select(
            selectEstimateTimeFilters
        );

        this.estimateTimeFilters$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((filters) => {
                this.filtersGt = filters.filtersGt;
                this.filtersLt = filters.filtersLt;
            });
        this.estimateTimeCurrentFilter$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((estimateTime) => {
                this.rangeValues = [
                    estimateTime.currentFilterLt.id,
                    estimateTime.currentFilterGt.id,
                ];
            });
    }

    getEstimateTimeNameLt(id: number): string {
        return this.filtersLt.find((filter: Filter) => filter.id === id).name;
    }

    getEstimateTimeNameGt(id: number): string {
        return this.filtersGt.find((filter: Filter) => filter.id === id).name;
    }

    changeEstimateTime() {
        if (this.filtersLt.length > 0 && this.filtersGt.length > 0) {
            const newcurrentFilterLt = this.filtersLt.find(
                (filter: Filter) => filter.id === this.rangeValues[0]
            );
            const newcurrentFilterGt = this.filtersGt.find(
                (filter: Filter) => filter.id === this.rangeValues[1]
            );
            this.store.dispatch(
                setCurrentEstimateTimeFiltersTasks({
                    currentFilterLt: newcurrentFilterLt,
                    currentFilterGt: newcurrentFilterGt,
                })
            );

            this.dialogRef.close();
        }
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }
}
