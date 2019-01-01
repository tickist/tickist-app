import {Component} from '@angular/core';
import {MatDialogRef} from '@angular/material';
import {TasksFiltersService} from '../../services/tasks-filters.service';


@Component({
    selector: 'assigned-to-dialog',
    styleUrls: ['./assigned-to.dialog.component.scss'],
    templateUrl: './assigned-to.dialog.component.html'
})
export class AssignedToDialogComponent {

    assignedToValues: any = [];
    assignedToValue: any = {};
    assignedToValueId: number;

    constructor(public dialogRef: MatDialogRef<AssignedToDialogComponent>, private tasksFiltersService: TasksFiltersService) {
        this.tasksFiltersService.currentTasksFilters$.subscribe((filters) => {
            if (filters.length > 0) {
                this.assignedToValue = filters.filter(filter => filter.label === 'assignedTo')[0];
                this.assignedToValueId = this.assignedToValue.id;
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
