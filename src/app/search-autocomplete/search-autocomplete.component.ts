import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {TaskService} from '../services/task.service';
import {Task} from '../models/tasks';
import {FormControl} from '@angular/forms';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {ObservableMedia} from '@angular/flex-layout';
import {Router} from '@angular/router';
import {MatAutocompleteSelectedEvent} from '@angular/material';

@Component({
    selector: 'tickist-search-autocomplete',
    templateUrl: './search-autocomplete.component.html',
    styleUrls: ['./search-autocomplete.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchAutocompleteComponent implements OnInit {
    tasks: Task[];
    searchControl = new FormControl();
    filteredOptions: Observable<Task[]>;
    constructor(private taskService: TaskService, protected router: Router) {
    }

    ngOnInit() {
        this.taskService.tasks$.subscribe(((tasks: Task[]) => this.tasks = tasks));
        this.filteredOptions = this.searchControl.valueChanges
            .pipe(
                startWith(''),
                map(value => this._filter(value))
            );
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
