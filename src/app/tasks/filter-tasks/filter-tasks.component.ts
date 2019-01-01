import {Component, OnInit, Input} from '@angular/core';
import {TasksFiltersService} from '../../services/tasks-filters.service';
import {TagsFilterDialogComponent} from '../tags-filter-dialog/tags-filter-dialog.component';
import {EstimateTimeDialogComponent} from '../estimate-time-dialog/estimate-time-dialog.component';
import {TasksFilterDialogComponent} from '../tasks-filter-dialog/tasks-filter-dialog.component';
import {AssignedToDialogComponent} from '../assigned-to-dialog/assigned-to.dialog.component';
import {MatDialog, MatDialogConfig} from '@angular/material';


@Component({
    selector: 'app-filter-tasks',
    templateUrl: './filter-tasks.component.html',
    styleUrls: ['./filter-tasks.component.scss']
})
export class FilterTasksComponent implements OnInit {
    @Input() showTags: boolean;
    filterValue: any = {};
    assignedToValue: any = {};
    estimateTime__ltValue: any = {};
    estimateTime__gtValue: any = {};
    tagsFilterValue: any = {};
    matDialogConfig: MatDialogConfig;

    constructor(public dialog: MatDialog, private tasksFiltersService: TasksFiltersService) {
        this.matDialogConfig = {'height': '350px', 'width': '300px'};
    }

    openTasksFilterDialog() {
        const dialogRef = this.dialog.open(TasksFilterDialogComponent, this.matDialogConfig);
    }

    openAssignedToDialog() {
        const dialogRef = this.dialog.open(AssignedToDialogComponent, this.matDialogConfig);
    }

    openTagsFilterDialog() {
        const dialogRef = this.dialog.open(TagsFilterDialogComponent, this.matDialogConfig);
    }

    openEstimateTimeDialog() {
        const dialogRef = this.dialog.open(EstimateTimeDialogComponent, this.matDialogConfig);
    }

    ngOnInit() {
        this.tasksFiltersService.currentTasksFilters$.subscribe((filters) => {

            if (filters.length > 0) {
                this.filterValue = filters.filter(filter => filter.label === 'filter')[0];
                this.assignedToValue = filters.filter(filter => filter.label === 'assignedTo')[0];
                this.estimateTime__ltValue = filters.filter(filter => filter.label === 'estimateTime__lt')[0];
                this.estimateTime__gtValue = filters.filter(filter => filter.label === 'estimateTime__gt')[0];
                this.tagsFilterValue = filters.filter(filter => filter.label === 'tags')[0];
            }
        });
    }

    tagsValue() {
        if (this.tagsFilterValue) {
            if (this.tagsFilterValue.value instanceof String || typeof this.tagsFilterValue.value === 'string') {
                return this.tagsFilterValue.value;
            } else if (this.tagsFilterValue.value instanceof Array) {
                return `${this.tagsFilterValue.value.length} selected`;
            }
        } else {
            return '';
        }

    }

}





