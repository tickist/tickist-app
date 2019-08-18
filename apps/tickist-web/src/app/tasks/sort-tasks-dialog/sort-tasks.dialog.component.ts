import {Component, OnDestroy, OnInit} from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import {selectCurrentSortBy, selectSortByOptions} from '../../core/selectors/sort-by-tasks.selectors';
import {Store} from '@ngrx/store';
import {AppStore} from '../../store';
import {SortBy} from '../models/sortBy';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {SetCurrentSortBy} from '../../core/actions/tasks/sort-tasks.actions';


@Component({
    selector: 'tickist-sort-by-dialog',
    templateUrl: './sort-tasks.dialog.component.html',
    styleUrls: ['./sort-tasks.dialog.component.scss']
})
export class SortByDialogComponent implements  OnInit, OnDestroy {
    sortByValues: SortBy[] = [];
    sortByValue: SortBy;
    sortByValueId: number;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(private dialogRef: MatDialogRef<SortByDialogComponent>,
                private store: Store<AppStore>) {

    }

    ngOnInit(): void {
        this.store.select(selectCurrentSortBy).pipe(takeUntil(this.ngUnsubscribe)).subscribe(
            (sortBy: SortBy) => {
                this.sortByValue = sortBy;
                this.sortByValueId = sortBy.id;
            });

        this.store.select(selectSortByOptions).pipe(takeUntil(this.ngUnsubscribe)).subscribe(
            (sortByOptions: SortBy[]) => this.sortByValues = sortByOptions
        );
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    changeSortingBy($event) {
        if (this.sortByValues.length > 0) {
            this.sortByValue = this.sortByValues
                .filter(sortBy => sortBy.id === $event.value)[0];
            this.sortByValueId = this.sortByValue['id'];
            this.store.dispatch(new SetCurrentSortBy({currentSortBy: this.sortByValue}));
            this.dialogRef.close();
        }
    }

}
