import {Component, OnDestroy, OnInit} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {Store} from '@ngrx/store';
import {selectAllFutureTasksFilters, selectCurrentFutureTasksFilter} from '../../core/selectors/future-tasks.selectors';
import {Filter} from '@data/filter';
import {setCurrentFutureTaskFilter} from "../../core/actions/future-tasks-filters.actions";
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';


@Component({
    selector: 'tickist-filter-future-tasks',
    templateUrl: './filter-future-tasks.component.html',
    styleUrls: ['./filter-future-tasks.component.scss'],
    standalone: true,
    imports: [MatRadioModule, FormsModule, NgFor, NgIf, FaIconComponent]
})
export class FilterFutureTasksComponent implements OnInit, OnDestroy {
    filterValueId: number;
    filters$: Observable<Filter[]>;
    currentFilter$: Observable<Filter>;
    filters: Filter[];
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(private store: Store) {
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
            this.store.dispatch(setCurrentFutureTaskFilter({currentFilter: newCurrentFilter}));
        }
    }
}
