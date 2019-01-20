import {MatDialogRef} from '@angular/material';
import {Component, OnDestroy} from '@angular/core';
import {ProjectsFiltersService} from '../../services/projects-filters.service';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';


@Component({
    selector: 'app-filter-projects',
    templateUrl: './filter-projects.dialog.component.html',
})
export class FilterProjectDialogComponent implements OnDestroy {
    filtersValues: any = [];
    filterValue: any = {};
    filterValueId: number;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(public dialogRef: MatDialogRef<FilterProjectDialogComponent>, protected projectsFiltersService: ProjectsFiltersService) {
        this.projectsFiltersService.currentProjectsFilters$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((filter) => {

            if (filter) {
                this.filterValue = filter;
                this.filterValueId = this.filterValue['id'];
            }

        });

        this.projectsFiltersService.projectsFilters$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((filters) => {
            if (filters.length > 0) {
                this.filtersValues = filters.filter(filter => filter.label === 'filter');

            }
        });

    }

    close(result) {
        this.dialogRef.close(result);
    }

    changeFilter($event) {
        if (this.filtersValues.length > 0) {
            this.filterValue = this.filtersValues.find(filter => filter.label === 'filter' && filter.id === $event.value);
            this.filterValueId = this.filterValue['id'];
            this.projectsFiltersService.updateCurrentFilter(this.filterValue);
            this.dialogRef.close();

        }

    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

}
