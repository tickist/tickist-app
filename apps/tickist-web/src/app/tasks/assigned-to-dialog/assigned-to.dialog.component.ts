import {Component, OnDestroy, OnInit} from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import {TasksFiltersService} from '../../core/services/tasks-filters.service';
import {Observable, Subject} from 'rxjs';
import {AppStore} from '../../store';
import {Store} from '@ngrx/store';
import {selectAssignedToFilters, selectCurrentAssignedToFilter} from '../../core/selectors/filters-tasks.selectors';
import {SetCurrentAssignedToFilter} from '../../core/actions/tasks/assigned-to-filters-tasks.actions';
import {takeUntil} from 'rxjs/operators';
import {Filter} from '@data/filter';


@Component({
    selector: 'tickist-assigned-to-dialog',
    styleUrls: ['./assigned-to.dialog.component.scss'],
    templateUrl: './assigned-to.dialog.component.html'
})
export class AssignedToDialogComponent implements OnInit, OnDestroy {
    assignedToCurrentFilter$: Observable<Filter>;
    assignedToFilters$: Observable<Filter[]>;
    assignedToValues: any = [];
    assignedToValue: any = {};
    assignedToValueId: number;
    filters: Filter[];
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(public dialogRef: MatDialogRef<AssignedToDialogComponent>, private store: Store) {
        // @TODO remove it
        // this.tasksFiltersService.currentTasksFilters$.subscribe((filters) => {
        //     if (filters.length > 0) {
        //         this.assignedToValue = filters.filter(filter => filter.label === 'assignedTo')[0];
        //         this.assignedToValueId = this.assignedToValue.id;
        //     }
        // });
        //
        // this.tasksFiltersService.tasksFilters$.subscribe((filters) => {
        //     if (filters.length > 0) {
        //         this.assignedToValues = filters.filter(filter => filter.label === 'assignedTo');
        //     }
        // });

    }

    ngOnInit() {
        this.assignedToCurrentFilter$ = this.store.select(selectCurrentAssignedToFilter);
        this.assignedToFilters$ = this.store.select(selectAssignedToFilters);

        this.assignedToFilters$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((filters: Filter[]) => {
                this.filters = filters;
            });

        this.assignedToCurrentFilter$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((filter: Filter) => {
                this.assignedToValueId = filter.id;
            });

    }

    changeAssignedTo($event) {
        if (this.filters.length > 0) {
            const newCurrentFilter = this.filters.find(filter => filter.id === $event.value);
            this.store.dispatch(new SetCurrentAssignedToFilter({currentFilter: newCurrentFilter}));
            this.dialogRef.close();
        }
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }
}
