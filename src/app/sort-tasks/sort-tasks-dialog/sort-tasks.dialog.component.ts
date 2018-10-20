import {Component} from '@angular/core';
import {TaskService} from '../../services/task-service';
import {MatDialogRef} from '@angular/material';
import {TasksFiltersService} from "../../services/tasks-filters.service";


@Component({
    selector: 'sort-by-dialog',
    templateUrl: './sort-tasks.dialog.component.html'
})
export class SortByDialog {
    
    sortingByValues: any = [];
    sortingByValue: any = {};
    sortingByValueId: number;
    
    constructor(public dialogRef: MatDialogRef<SortByDialog>, public taskService: TaskService, protected tasksFiltersService: TasksFiltersService) {
        this.tasksFiltersService.currentTasksFilters$.subscribe((filters) => {
            
            if (filters.length > 0) {
                this.sortingByValue = filters.filter(filter => filter.label === 'sorting')[0];
                this.sortingByValueId = this.sortingByValue['id'];
            }
            
        });
        
        this.tasksFiltersService.tasksFilters$.subscribe((filters) => {
            if (filters.length > 0) {
                this.sortingByValues = filters.filter(filter => filter.label === 'sorting');
                
            }
        });
        
    }
    
    changeSortingBy($event) {
        if (this.sortingByValues.length > 0) {
            this.sortingByValue = this.sortingByValues.filter(sortingBy => sortingBy.label === 'sorting' && sortingBy.id === $event.value)[0];
            this.sortingByValueId = this.sortingByValue['id'];
            this.tasksFiltersService.updateCurrentFilter(this.sortingByValue);
            this.dialogRef.close();
        }
    }
    
}