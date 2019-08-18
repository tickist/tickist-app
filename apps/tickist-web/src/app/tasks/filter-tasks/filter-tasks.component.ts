import {Component, OnInit, Input, OnDestroy} from '@angular/core';
import {TasksFiltersService} from '../../core/services/tasks-filters.service';
import {TagsFilterDialogComponent} from '../tags-filter-dialog/tags-filter-dialog.component';
import {EstimateTimeDialogComponent} from '../estimate-time-dialog/estimate-time-dialog.component';
import {TasksFilterDialogComponent} from '../tasks-filter-dialog/tasks-filter-dialog.component';
import {AssignedToDialogComponent} from '../assigned-to-dialog/assigned-to.dialog.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import {
    selectCurrentAssignedToFilter,
    selectCurrentEstimateTimeFilter,
    selectCurrentMainFilter,
    selectCurrentTagsFilter
} from '../../core/selectors/filters-tasks.selectors';
import {Store} from '@ngrx/store';
import {AppStore} from '../../store';
import {Observable, Subject} from 'rxjs';
import {Filter} from '../../models/filter';
import {takeUntil} from 'rxjs/operators';


@Component({
    selector: 'app-filter-tasks',
    templateUrl: './filter-tasks.component.html',
    styleUrls: ['./filter-tasks.component.scss']
})
export class FilterTasksComponent implements OnInit, OnDestroy {
    @Input() showTags: boolean;
    currentMainFilter$: Observable<Filter>;
    currentAssignedToFilter$: Observable<Filter>;
    currentTagsFilter$: Observable<Filter>;
    currentEstimateTimeFilter$: Observable<{currentFilter_lt: Filter, currentFilter_gt: Filter}>;
    tagsFilter: Filter;
    tagsFilterValue: any = {};
    matDialogConfig: MatDialogConfig;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(public dialog: MatDialog, private tasksFiltersService: TasksFiltersService, private store: Store<AppStore>) {
        this.matDialogConfig = {'height': '350px', 'width': '300px'};
    }

    openTasksFilterDialog() {
        const dialogRef = this.dialog.open(TasksFilterDialogComponent, this.matDialogConfig);
    }

    openAssignedToDialog() {
        const dialogRef = this.dialog.open(AssignedToDialogComponent, this.matDialogConfig);
    }

    openTagsFilterDialog() {
        const dialogRef = this.dialog.open(TagsFilterDialogComponent, this.matDialogConfig);
    }

    openEstimateTimeDialog() {
        const dialogRef = this.dialog.open(EstimateTimeDialogComponent, this.matDialogConfig);
    }

    ngOnInit() {
        this.currentMainFilter$ = this.store.select(selectCurrentMainFilter);
        this.currentAssignedToFilter$ = this.store.select(selectCurrentAssignedToFilter);
        this.currentEstimateTimeFilter$ = this.store.select(selectCurrentEstimateTimeFilter);
        this.currentTagsFilter$ = this.store.select(selectCurrentTagsFilter);
        this.currentTagsFilter$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(tagsFilter => {
            this.tagsFilter = tagsFilter;
        });

    }

    tagsValue() {
        if (this.tagsFilter) {
            if (this.tagsFilter.value instanceof String || typeof this.tagsFilter.value === 'string') {
                return this.tagsFilter.value;
            } else if (this.tagsFilter.value instanceof Array) {
                return `${this.tagsFilter.value.length} selected`;
            }
        } else {
            return '';
        }

    }
    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

}





