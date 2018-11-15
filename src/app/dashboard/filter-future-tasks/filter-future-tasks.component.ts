import {Component, OnDestroy, OnInit} from '@angular/core';
import {FutureTasksFiltersService} from '../../services/future-tasks-filters-service';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
    selector: 'tickist-filter-future-tasks',
    templateUrl: './filter-future-tasks.component.html',
    styleUrls: ['./filter-future-tasks.component.scss']
})
export class FilterFutureTasksComponent implements OnInit, OnDestroy {
    filtersValues: any = [];
    filterValue: any = {};
    filterValueId: number;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(private futureTasksFiltersService: FutureTasksFiltersService) {
    }

    ngOnInit() {
        this.futureTasksFiltersService.currentFutureTasksFilters$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((filter) => {
                if (filter) {
                    this.filterValue = filter;
                    this.filterValueId = this.filterValue['id'];
                }
            });

        this.futureTasksFiltersService.futureTasksFilters$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((filters) => {
                if (filters.length > 0) {
                    this.filtersValues = filters.filter(filter => filter.label === 'filter');
                }
            });
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    changeFilter($event) {
        if (this.filtersValues.length > 0) {
            this.filterValue = this.filtersValues.find(filter => filter.label === 'filter' && filter.id === $event.value);
            this.filterValueId = this.filterValue['id'];
            this.futureTasksFiltersService.updateCurrentFutureTasksFilter(this.filterValue);
        }
    }
}
