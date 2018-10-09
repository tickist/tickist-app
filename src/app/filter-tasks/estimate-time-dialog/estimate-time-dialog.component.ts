import {Component} from '@angular/core';
import {MatDialogRef} from '@angular/material';
import {TaskService} from '../../services/task-service';
import {TasksFiltersService} from '../../services/tasks-filters.service';
import {TasksFilterDialog} from '../filter-tasks.component';

@Component({
    selector: 'task-estimate-time-filter-dialog',
    templateUrl: './task-estimate-time-filter-dialog.html'
})
export class EstimateTimeDialog {

    rangeValues: number[];
    estimateTime__ltValues: any = [];
    estimateTime__ltValue: any = {};
    estimateTime__ltId: number;
    estimateTime__gtValues: any = [];
    estimateTime__gtValue: any = {};
    estimateTime__gtId: number;

    constructor(public dialogRef: MatDialogRef<TasksFilterDialog>, public taskService: TaskService, private tasksFiltersService: TasksFiltersService) {
        this.tasksFiltersService.currentTasksFilters$.subscribe((filters) => {

            if (filters.length > 0) {
                this.estimateTime__ltValue = filters.filter(filter => filter.label === 'estimateTime__lt')[0];
                this.estimateTime__gtValue = filters.filter(filter => filter.label === 'estimateTime__gt')[0];
                this.estimateTime__ltId = this.estimateTime__ltValue['id'];
                this.estimateTime__gtId = this.estimateTime__gtValue['id'];
            }

        });

        this.tasksFiltersService.tasksFilters$.subscribe((filters) => {
            if (filters.length > 0) {
                this.estimateTime__ltValues = filters.filter(filter => filter.label === 'estimateTime__lt');
                this.estimateTime__gtValues = filters.filter(filter => filter.label === 'estimateTime__gt');

            }
        });
        this.rangeValues = [this.estimateTime__ltId, this.estimateTime__gtId];

    }

    getEstimateTime__lt(id) {
        return this.estimateTime__ltValues.filter(elem => elem.id == id)[0].name;
    }

    getEstimateTime__gt(id) {
        return this.estimateTime__gtValues.filter(elem => elem.id == id)[0].name;
    }

    changeEstimateTime() {
        if (this.estimateTime__ltValues.length > 0 && this.estimateTime__gtValues.length > 0) {
            this.estimateTime__ltValue = this.estimateTime__ltValues.filter(elem => elem.label === 'estimateTime__lt' && elem.id == this.rangeValues[0])[0];
            this.estimateTime__ltId = this.estimateTime__ltValue['id'];

            this.estimateTime__gtValue = this.estimateTime__gtValues.filter(elem => elem.label === 'estimateTime__gt' && elem.id == this.rangeValues[1])[0];
            this.estimateTime__gtId = this.estimateTime__gtValue['id'];
            this.tasksFiltersService.updateCurrentFilter(this.estimateTime__ltValue);
            this.tasksFiltersService.updateCurrentFilter(this.estimateTime__gtValue);
            this.dialogRef.close();
        }
    }


}
