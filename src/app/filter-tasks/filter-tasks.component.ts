import {Component, OnInit, Input} from '@angular/core';
import {TaskService} from '../services/task-service';
import {TagService} from '../services/tag-service';
import {MatDialogRef, MatDialog} from '@angular/material';
import {TasksFiltersService} from "../services/tasks-filters.service";
import {TagsFilterDialog} from './tags-filter-dialog/tags-filter-dialog.component';
import {EstimateTimeDialog} from './estimate-time-dialog/estimate-time-dialog.component';

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

    constructor(public dialog: MatDialog, private tasksFiltersService: TasksFiltersService, private tagService: TagService) {
    }

    openTasksFilterDialog() {
        const dialogRef = this.dialog.open(TasksFilterDialog);
        dialogRef.afterClosed().subscribe(result => {
            console.log('aaa')
        });
    }

    openAssignedToDialog() {
        const dialogRef = this.dialog.open(AssignedToDialog, {
            height: '400px',
            width: '300px',
        });
        dialogRef.afterClosed().subscribe(result => {
            console.log('aaa')
        });
    }

    openTagsFilterDialog() {
        const dialogRef = this.dialog.open(TagsFilterDialog);
        dialogRef.afterClosed().subscribe(result => {
            console.log('aaa')
        });
    }

    openEstimateTimeDialog() {
        const dialogRef = this.dialog.open(EstimateTimeDialog);
        dialogRef.afterClosed().subscribe(result => {
            console.log('aaa')
        });
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


@Component({
    selector: 'tasks-filter-dialog',
    templateUrl: './tasks-filter-dialog.html'
})
export class TasksFilterDialog {

    filterValues: any = [];
    filterValue: any = {};
    filterValueId: number;

    constructor(public dialogRef: MatDialogRef<TasksFilterDialog>, public taskService: TaskService, private tasksFiltersService: TasksFiltersService) {
        this.tasksFiltersService.currentTasksFilters$.subscribe((filters) => {

            if (filters.length > 0) {
                this.filterValue = filters.filter(filter => filter.label === 'filter')[0];
                this.filterValueId = this.filterValue['id'];
            }

        });

        this.tasksFiltersService.tasksFilters$.subscribe((filters) => {
            if (filters.length > 0) {
                this.filterValues = filters.filter(filter => filter.label === 'filter');
            }
        });
    }

    changeFilter($event) {
        if (this.filterValues.length > 0) {
            this.filterValue = this.filterValues
                .filter(filter => filter.label === 'filter' && filter.id === $event.value)[0];
            this.filterValueId = this.filterValue['id'];
            this.tasksFiltersService.updateCurrentFilter(this.filterValue);
            this.dialogRef.close();
        }
    }

}

@Component({
    selector: 'assigned-to-dialog',
    templateUrl: './assigned-to-dialog.html'
})
export class AssignedToDialog {

    assignedToValues: any = [];
    assignedToValue: any = {};
    assignedToValueId: number;

    constructor(public dialogRef: MatDialogRef<TasksFilterDialog>, public taskService: TaskService, private tasksFiltersService: TasksFiltersService) {
        this.tasksFiltersService.currentTasksFilters$.subscribe((filters) => {
            if (filters.length > 0) {
                this.assignedToValue = filters.filter(filter => filter.label === 'assignedTo')[0];
                this.assignedToValueId = this.assignedToValue['id'];
            }
        });

        this.tasksFiltersService.tasksFilters$.subscribe((filters) => {
            if (filters.length > 0) {
                this.assignedToValues = filters.filter(filter => filter.label === 'assignedTo');
            }
        });

    }

    changeAssignedTo($event) {
        if (this.assignedToValues.length > 0) {
            this.assignedToValue = this.assignedToValues
                .filter(assignedTo => assignedTo.label === 'assignedTo' && assignedTo.id === $event.value)[0];
            this.assignedToValueId = this.assignedToValue['id'];
            this.tasksFiltersService.updateCurrentFilter(this.assignedToValue);
            this.dialogRef.close();
        }
    }

}
