import {Component, OnDestroy, OnInit} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {AppStore} from '../../../../store';
import {Store} from '@ngrx/store';
import {Filter} from '../../../../models/filter';
import {selectAllFutureTasksFilters, selectCurrentFutureTasksFilter} from '../../future-tasks.selectors';
import {SetCurrentFutureTaskFilter} from '../../future-tasks-filters.actions';

@Component({
    selector: 'tickist-filter-future-tasks',
    templateUrl: './filter-future-tasks.component.html',
    styleUrls: ['./filter-future-tasks.component.scss']
})
export class FilterFutureTasksComponent implements OnInit, OnDestroy {
    filterValueId: number;
    filters$: Observable<Filter[]>;
    currentFilter$: Observable<Filter>;
    filters: Filter[];
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(private store: Store<AppStore>) {
    }

    ngOnInit() {

        this.filters$ = this.store.select(selectAllFutureTasksFilters);
        this.currentFilter$ = this.store.select(selectCurrentFutureTasksFilter);

        this.filters$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((filters: Filter[]) => {
            this.filters = filters;
        });

        this.currentFilter$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((filter: Filter) => {
            this.filterValueId = filter.id;
        });
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    changeFilter($event) {
        if (this.filters.length > 0) {
            const newCurrentFilter = this.filters.find(filter => filter.id === $event.value);
            this.store.dispatch(new SetCurrentFutureTaskFilter({currentFilter: newCurrentFilter}));
        }
    }
}
