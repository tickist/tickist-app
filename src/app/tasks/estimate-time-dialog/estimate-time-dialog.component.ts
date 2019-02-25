import {Component, OnInit} from '@angular/core';
import {MatDialogRef} from '@angular/material';
import {TasksFiltersService} from '../tasks-filters.service';
import {Observable, Subject} from 'rxjs';
import {Filter} from '../../models/filter';
import {selectCurrentEstimateTimeFilter, selectEstimateTimeFilters} from '../filters-tasks.selectors';
import {SetCurrentEstimateTimeFiltersTasks} from '../../core/actions/estimate-time-filters-tasks.actions';
import {Store} from '@ngrx/store';
import {AppStore} from '../../store';
import {takeUntil} from 'rxjs/operators';


@Component({
    selector: 'task-estimate-time-filter-dialog',
    styleUrls: ['./estimate-time-dialog.component.scss'],
    templateUrl: './task-estimate-time-filter-dialog.html'
})
export class EstimateTimeDialogComponent implements OnInit {
    estimateTimeCurrentFilter$: Observable<{currentFilter_lt: Filter, currentFilter_gt: Filter}>;
    estimateTimeFilters$: Observable<{filters_lt: Filter[], filters_gt: Filter[]}>;
    filters_lt: Filter[];
    filters_gt: Filter[];
    rangeValues: number[];
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    estimateTime__ltValues: any = [];
    estimateTime__ltValue: any = {};
    estimateTime__ltId: number;
    estimateTime__gtValues: any = [];
    estimateTime__gtValue: any = {};
    estimateTime__gtId: number;

    constructor(public dialogRef: MatDialogRef<EstimateTimeDialogComponent>, private store: Store<AppStore>) {
        // this.tasksFiltersService.currentTasksFilters$.subscribe((filters) => {
        //
        //     if (filters.length > 0) {
        //         this.estimateTime__ltValue = filters.filter(filter => filter.label === 'estimateTime__lt')[0];
        //         this.estimateTime__gtValue = filters.filter(filter => filter.label === 'estimateTime__gt')[0];
        //         this.estimateTime__ltId = this.estimateTime__ltValue['id'];
        //         this.estimateTime__gtId = this.estimateTime__gtValue['id'];
        //     }
        // });
        //
        // this.tasksFiltersService.tasksFilters$.subscribe((filters) => {
        //     if (filters.length > 0) {
        //         this.estimateTime__ltValues = filters.filter(filter => filter.label === 'estimateTime__lt');
        //         this.estimateTime__gtValues = filters.filter(filter => filter.label === 'estimateTime__gt');
        //
        //     }
        // });
        // this.rangeValues = [this.estimateTime__ltId, this.estimateTime__gtId];

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
        })

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
            this.store.dispatch(new SetCurrentEstimateTimeFiltersTasks({
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
