import {Component, OnInit, ChangeDetectionStrategy, OnDestroy} from '@angular/core';
import {Task} from '../../../models/tasks';
import {FormControl} from '@angular/forms';
import {Observable, Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, map, startWith, takeUntil} from 'rxjs/operators';
import {Router} from '@angular/router';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import {AppStore} from '../../../store';
import {Store} from '@ngrx/store';
import {SetCurrrentSearchTasksFilter} from '../../actions/tasks/search-tasks.actions';
import {selectAllUndoneTasks} from '../../selectors/task.selectors';
import {homeRoutesName} from '../../../routing.module';
import {editTaskRoutesName} from '../../../modules/edit-task/routes-names';

@Component({
    selector: 'tickist-search-autocomplete',
    templateUrl: './search-autocomplete.component.html',
    styleUrls: ['./search-autocomplete.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchAutocompleteComponent implements OnInit, OnDestroy {
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    tasks: Task[];
    searchControl = new FormControl();
    filteredOptions: Observable<Task[]>;
    constructor(private store: Store<AppStore>, private router: Router) {
    }

    ngOnInit() {
        this.store.select(selectAllUndoneTasks).pipe(takeUntil(this.ngUnsubscribe)).subscribe(((tasks: Task[]) => this.tasks = tasks));

        this.filteredOptions = this.searchControl.valueChanges
            .pipe(
                startWith(''),
                map(value => this._filter(value))
            );

        this.searchControl.valueChanges.pipe(
            takeUntil(this.ngUnsubscribe),
            debounceTime(400),
            distinctUntilChanged()
        ).subscribe((value) => {
            this.store.dispatch(new SetCurrrentSearchTasksFilter({searchText: value}));
        });
    }

    goToTask($event: MatAutocompleteSelectedEvent) {
        this.router.navigate([homeRoutesName.HOME, {outlets: {content: [editTaskRoutesName.EDIT_TASK, $event.option.value]}}]);
        this.searchControl.reset();
    }

    private _filter(value: string | number): Task[] {
        const filterValue = typeof value === 'string' ?  value.toLowerCase() : value;
        if (!value) {
           return [];
        }
        return this.tasks.filter(taskName => taskName.name.toLowerCase().includes(filterValue.toString()));
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

}
