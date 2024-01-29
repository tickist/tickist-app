import {Component, OnDestroy, OnInit} from '@angular/core';
import { MatDialogRef, MatDialogTitle, MatDialogContent } from '@angular/material/dialog';
import {Store} from '@ngrx/store';
import {selectCurrentMainFilter, selectMainFilters} from '../../core/selectors/filters-tasks.selectors';
import {Observable, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {Filter} from '@data/filter';
import {setCurrentMainFilter} from "../../core/actions/tasks/main-filters-tasks.actions";
import { NgFor, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';

@Component({
    selector: 'tickist-tasks-filter-dialog',
    styleUrls: ['./tasks-filter-dialog.component.scss'],
    templateUrl: './tasks-filter-dialog.html',
    standalone: true,
    imports: [MatDialogTitle, MatDialogContent, MatRadioModule, FormsModule, NgFor, AsyncPipe]
})
export class TasksFilterDialogComponent implements OnInit, OnDestroy {
    filterValueId: number;
    filters$: Observable<Filter[]>;
    currentFilter$: Observable<Filter>;
    filters: Filter[];
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(public dialogRef: MatDialogRef<TasksFilterDialogComponent>, private store: Store) {}

    ngOnInit() {
        this.filters$ = this.store.select(selectMainFilters);
        this.currentFilter$ = this.store.select(selectCurrentMainFilter);

        this.filters$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((filters: Filter[]) => {
            this.filters = filters;
        });

        this.currentFilter$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((filter: Filter) => {
            this.filterValueId = filter.id;
        });
    }

    changeFilter($event) {
        if (this.filters.length > 0) {
            const newCurrentFilter = this.filters.find(filter => filter.id === $event.value);
            this.store.dispatch(setCurrentMainFilter({currentFilter: newCurrentFilter}));
            this.dialogRef.close();
        }
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

}
