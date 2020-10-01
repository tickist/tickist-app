import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {Observable, Subject} from 'rxjs';
import {selectCurrentEstimateTimeFilter, selectEstimateTimeFilters} from '../../core/selectors/filters-tasks.selectors';
import {Store} from '@ngrx/store';
import {takeUntil} from 'rxjs/operators';
import {Filter} from '@data/filter';
import {setCurrentEstimateTimeFiltersTasks} from "../../core/actions/tasks/estimate-time-filters-tasks.actions";


@Component({
    selector: 'tickist-task-estimate-time-filter-dialog',
    styleUrls: ['./estimate-time-dialog.component.scss'],
    templateUrl: './task-estimate-time-filter-dialog.html'
})
export class EstimateTimeDialogComponent implements OnInit, OnDestroy {
    estimateTimeCurrentFilter$: Observable<{currentFilter_lt: Filter, currentFilter_gt: Filter}>;
    estimateTimeFilters$: Observable<{filters_lt: Filter[], filters_gt: Filter[]}>;
    filters_lt: Filter[];
    filters_gt: Filter[];
    rangeValues: number[];
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(public dialogRef: MatDialogRef<EstimateTimeDialogComponent>, private store: Store) {
    }

    ngOnInit() {
        this.estimateTimeCurrentFilter$ = this.store.select(selectCurrentEstimateTimeFilter);
        this.estimateTimeFilters$ = this.store.select(selectEstimateTimeFilters);

        this.estimateTimeFilters$
            .pipe(takeUntil(this.ngUnsubscribe)).subscribe((filters) => {
            this.filters_gt = filters.filters_gt;
            this.filters_lt = filters.filters_lt;
        });
        this.estimateTimeCurrentFilter$
            .pipe(takeUntil(this.ngUnsubscribe)).subscribe((estimateTime) => {
            this.rangeValues = [estimateTime.currentFilter_lt.id, estimateTime.currentFilter_gt.id];
        });

    }

    getEstimateTimeName__lt(id: number): string {
        return  this.filters_lt.find((filter: Filter) => filter.id === id).name;
    }

    getEstimateTimeName__gt(id: number): string {
        return  this.filters_gt.find((filter: Filter) => filter.id === id).name;
    }

    changeEstimateTime() {
        if (this.filters_lt.length > 0 && this.filters_gt.length > 0) {
            const newCurrentFilter_lt = this.filters_lt.find(
                (filter: Filter) => filter.id === this.rangeValues[0]
            );
            const newCurrentFilter_gt = this.filters_gt.find(
                (filter: Filter) => filter.id === this.rangeValues[1]
            );
            this.store.dispatch(setCurrentEstimateTimeFiltersTasks({
                currentFilter_lt: newCurrentFilter_lt,
                currentFilter_gt: newCurrentFilter_gt
            }));

            this.dialogRef.close();
        }
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

}
