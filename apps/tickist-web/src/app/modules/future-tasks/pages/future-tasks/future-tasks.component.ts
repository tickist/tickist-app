import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {TaskService} from '../../../../core/services/task.service';
import {Observable, Subject} from 'rxjs';
import {filter, map, takeUntil} from 'rxjs/operators';
import {ActivatedRoute, Router} from '@angular/router';
import {ConfigurationService} from '../../../../core/services/configuration.service';
import {Task} from '@data/tasks/models/tasks';
import {User} from '@data/users/models';
import {FutureTasksFiltersService} from '../../future-tasks-filters.service';
import {MediaChange, MediaObserver} from '@angular/flex-layout';
import {UpdateUser} from '../../../../core/actions/user.actions';
import {AppStore} from '../../../../store';
import {Store} from '@ngrx/store';
import {selectLoggedInUser} from '../../../../core/selectors/user.selectors';
import {selectFutureTasksList} from '../../future-tasks.selectors';
import {UpdateActiveDate} from '../../../../core/actions/active-date.actions';
import {selectActiveDate} from '../../../../core/selectors/active-date.selectors';
import {IActiveDateElement} from '@data/active-data-element.interface';
import {Filter} from '@data/filter';
import {stateActiveDateElement} from '@data/state-active-date-element.enum';


@Component({
    selector: 'tickist-future-tasks',
    templateUrl: './future-tasks.component.html',
    styleUrls: ['./future-tasks.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FutureTasksComponent implements OnInit, OnDestroy {
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    tasks: Task[] = [];
    tasks$: Observable<Task[]>;
    user: User;
    activeDateElement$: Observable<IActiveDateElement>;
    futureTasks: Task[] = [];
    taskView: string;
    defaultTaskView: string;
    currentFilter: Filter;
    mediaChange: MediaChange;

    constructor(private taskService: TaskService, private route: ActivatedRoute, private router: Router,
                private configurationService: ConfigurationService, private store: Store<AppStore>,
                private futureTasksFiltersService: FutureTasksFiltersService, private cd: ChangeDetectorRef, private media: MediaObserver) {
        this.defaultTaskView = this.configurationService.TASK_EXTENDED_VIEW.value;
    }

    ngOnInit(): void {

        this.tasks$ = this.store.select(selectFutureTasksList);
        this.activeDateElement$ = this.store.select(selectActiveDate);
        this.route.params
            .pipe(
                map(params => params['date']),
                takeUntil(this.ngUnsubscribe)
            )
            .subscribe((param) => {
                this.store.dispatch(new UpdateActiveDate({date: param, state: stateActiveDateElement.future}));
            });

        this.media.media$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((mediaChange: MediaChange) => {
            this.mediaChange = mediaChange;
        });

        this.store.select(selectLoggedInUser)
            .pipe(
                takeUntil(this.ngUnsubscribe),
                filter(user => !!user)
            )
            .subscribe(user => {
                this.user = user;
                this.defaultTaskView = user.defaultTaskViewFutureView;
            });
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    changeTaskView(event): void {
        if (!event) return;
        this.taskView = event;
        if (this.user && this.user.defaultTaskViewFutureView !== event) {
            const user = Object.assign({}, this.user, {defaultTaskViewTodayView: event});
            this.store.dispatch(new UpdateUser({user}));
        }

    }

    trackByFn(index, item) {
        return item.id;
    }

}
