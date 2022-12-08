import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatLegacyDialogRef as MatDialogRef} from '@angular/material/legacy-dialog';
import {Observable, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {selectAllTagsFilters, selectCurrentTagFilter} from '../../tags-filters.selectors';
import {Store} from '@ngrx/store';
import {Filter} from '@data/filter';
import {setCurrentTagsListFilter} from "../../tags-filters.actions";


@Component({
    selector: 'tickist-filter-tags-dialog',
    templateUrl: './filter-tags-dialog.component.html',
    styleUrls: ['./filter-tags-dialog.component.css']
})
export class FilterTagsDialogComponent implements OnInit, OnDestroy {
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    filterValueId: number;
    filters: Filter[];
    filters$: Observable<Filter[]>;
    currentFilter$: Observable<Filter>;

    constructor(public dialogRef: MatDialogRef<FilterTagsDialogComponent>, private store: Store) {
    }

    ngOnInit() {
        this.filters$ = this.store.select(selectAllTagsFilters);
        this.currentFilter$ = this.store.select(selectCurrentTagFilter);

        this.filters$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((filters: Filter[]) => {
            this.filters = filters;
        });

        this.currentFilter$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((filter: Filter) => {
            this.filterValueId = filter.id;
        });
    }

    close(result) {
        this.dialogRef.close(result);
    }

    changeFilter($event) {
        if (this.filters.length > 0) {
            const newCurrentFilter = this.filters.find(filter => filter.id === $event.value);
            this.store.dispatch(setCurrentTagsListFilter({currentFilter: newCurrentFilter}));
            this.dialogRef.close();

        }
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }
}
