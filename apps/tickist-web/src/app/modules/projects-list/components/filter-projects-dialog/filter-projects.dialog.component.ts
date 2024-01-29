import { MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from "@angular/material/dialog";
import {Component, OnDestroy} from '@angular/core';
import {takeUntil} from 'rxjs/operators';
import {Observable, Subject} from 'rxjs';
import {Store} from '@ngrx/store';
import {selectAllProjectsFilters, selectCurrentProjectFilter} from '../../projects-filters.selectors';
import {Filter} from '@data/filter';
import {setCurrentProjectFilter} from "../../projects-filters.actions";
import { NgFor } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { FlexModule } from "@ngbracket/ngx-layout/flex";
import { MatRadioModule } from "@angular/material/radio";


@Component({
    selector: 'tickist-filter-projects',
    templateUrl: './filter-projects.dialog.component.html',
    styleUrls: ['./filter-projects.dialog.component.scss'],
    standalone: true,
    imports: [MatDialogTitle, MatDialogContent, MatRadioModule, FlexModule, FormsModule, NgFor, MatDialogActions]
})
export class FilterProjectDialogComponent implements OnDestroy {
    filterValueId: number;
    filters: Filter[];
    filters$: Observable<Filter[]>;
    projectsCurrentFilter$: Observable<Filter>;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(public dialogRef: MatDialogRef<FilterProjectDialogComponent>, private store: Store) {

        this.filters$ = this.store.select(selectAllProjectsFilters);
        this.projectsCurrentFilter$ = this.store.select(selectCurrentProjectFilter);
        this.projectsCurrentFilter$.pipe(
            takeUntil(this.ngUnsubscribe)
        ).subscribe((filter: Filter) => {
            this.filterValueId = filter.id;
        });

        this.filters$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((filters: Filter[]) => {
            this.filters = filters;
        });
    }

    close(result) {
        this.dialogRef.close(result);
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    changeFilter($event) {
        if (this.filters.length > 0) {
            const newCurrentFilter = this.filters.find(filter => filter.id === $event.value);
            this.store.dispatch(setCurrentProjectFilter({currentFilter: newCurrentFilter}));
            this.dialogRef.close();

        }

    }

}
