import {Component} from '@angular/core';
import {MatDialogRef} from '@angular/material';
import {TasksFiltersService} from '../../services/tasks-filters.service';

@Component({
    selector: 'tasks-filter-dialog',
    styleUrls: ['./tasks-filter-dialog.component.scss'],
    templateUrl: './tasks-filter-dialog.html'
})
export class TasksFilterDialogComponent {
    filterValues: any = [];
    filterValue: any = {};
    filterValueId: number;

    constructor(public dialogRef: MatDialogRef<TasksFilterDialogComponent>,  private tasksFiltersService: TasksFiltersService) {
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
