import {Component, OnInit} from '@angular/core';
import {MatDialogRef} from '@angular/material';
import {TagsFiltersService} from '../../services/tags-filters.service';


@Component({
    selector: 'tickist-filter-tags-dialog',
    templateUrl: './filter-tags-dialog.component.html',
    styleUrls: ['./filter-tags-dialog.component.css']
})
export class FilterTagsDialogComponent implements OnInit {
    filtersValues: any = [];
    filterValue: any = {};
    filterValueId: number;

    constructor(public dialogRef: MatDialogRef<FilterTagsDialogComponent>, protected tagsFiltersService: TagsFiltersService) {
    }

    ngOnInit() {
        this.tagsFiltersService.currentTagsFilters$.subscribe((filter) => {
            if (filter) {
                this.filterValue = filter;
                this.filterValueId = this.filterValue['id'];
            }

        });

        this.tagsFiltersService.tagsFilters$.subscribe((filters) => {
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
            this.tagsFiltersService.updateCurrentFilter(this.filterValue);
            this.dialogRef.close();

        }

    }
}
