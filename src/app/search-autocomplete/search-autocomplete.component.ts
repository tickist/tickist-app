import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {TaskService} from '../services/task.service';
import {Task} from '../models/tasks';
import {FormControl} from '@angular/forms';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {Router} from '@angular/router';
import {MatAutocompleteSelectedEvent} from '@angular/material';
import {TasksFiltersService} from '../services/tasks-filters.service';
import {Filter} from '../models/filter';

@Component({
    selector: 'tickist-search-autocomplete',
    templateUrl: './search-autocomplete.component.html',
    styleUrls: ['./search-autocomplete.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchAutocompleteComponent implements OnInit {
    tasks: Task[];
    searchTaskFilter: Filter;
    searchControl = new FormControl();
    filteredOptions: Observable<Task[]>;
    constructor(private tasksFiltersService: TasksFiltersService, private taskService: TaskService, protected router: Router) {
    }

    ngOnInit() {
        this.taskService.tasks$.subscribe(((tasks: Task[]) => this.tasks = tasks));
        this.tasksFiltersService.currentTasksFilters$.subscribe((filters) => {
            if (filters.length > 0) {
                this.searchTaskFilter = filters.filter(filter => filter.label === 'searchTasks')[0];
            }
        });
        this.filteredOptions = this.searchControl.valueChanges
            .pipe(
                startWith(''),
                map(value => this._filter(value))
            );

        this.searchControl.valueChanges.subscribe((value) => {
            this.searchTaskFilter.changeValue(value);
            this.tasksFiltersService.updateCurrentFilter(this.searchTaskFilter);
        });
    }

    goToTask($event: MatAutocompleteSelectedEvent) {
        this.router.navigate(['/home/task', $event.option.value]);
        this.searchControl.reset();
    }

    private _filter(value: string | number): Task[] {
        const filterValue = typeof value === 'string' ?  value.toLowerCase() : value;
        if (!value) {
           return [];
        }
        return this.tasks.filter(taskName => taskName.name.toLowerCase().includes(filterValue.toString()));
    }

}
