import {ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Task} from '@data/tasks/models/tasks';
import {FormControl} from '@angular/forms';
import {Observable, Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, map, startWith, takeUntil} from 'rxjs/operators';
import {NavigationEnd, Router} from '@angular/router';
import {MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import {Store} from '@ngrx/store';
import {selectAllUndoneTasks} from '../../selectors/task.selectors';
import {editTaskRoutesName} from '../../../modules/edit-task/routes-names';
import {homeRoutesName} from '../../../routing.module.name';
import {setCurrentSearchTasksFilter} from "../../actions/tasks/search-tasks.actions";
import {searchInputIsFocus} from "../../selectors/ui.selectors";
import {blurOnSearchInput} from "../../actions/ui.actions";


@Component({
    selector: 'tickist-search-autocomplete',
    templateUrl: './search-autocomplete.component.html',
    styleUrls: ['./search-autocomplete.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchAutocompleteComponent implements OnInit, OnDestroy {
    @ViewChild('searchInput', { static: true }) searchInput: ElementRef;
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    tasks: Task[];
    searchControl = new FormControl();
    filteredOptions: Observable<Task[]>;
    constructor(private store: Store, private router: Router) {
    }

    ngOnInit() {
        this.store.select(selectAllUndoneTasks).pipe(
            takeUntil(this.ngUnsubscribe)
        ).subscribe((tasks: Task[]) => this.tasks = tasks);

        this.store.select(searchInputIsFocus).pipe(
            takeUntil(this.ngUnsubscribe)
        ).subscribe((isFocus) => {
            if (isFocus) {
                this.searchInput.nativeElement.focus()
                this.store.dispatch(blurOnSearchInput())
            }
        });
        this.filteredOptions = this.searchControl.valueChanges
            .pipe(
                startWith(''),
                map(value => this._filter(value))
            );

        this.searchControl.valueChanges.pipe(
            debounceTime(400),
            distinctUntilChanged(),
            takeUntil(this.ngUnsubscribe),
        ).subscribe((value) => {
            this.store.dispatch(setCurrentSearchTasksFilter({searchText: value}));
        });

        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd),
            takeUntil(this.ngUnsubscribe),
        ).subscribe((event) => {
            this.searchControl.reset();
        });
    }

    goToTask($event: MatAutocompleteSelectedEvent) {
        this.router.navigate([homeRoutesName.HOME, editTaskRoutesName.EDIT_TASK, $event.option.value]);
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
