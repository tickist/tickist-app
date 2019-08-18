import {Component, OnInit, OnDestroy} from '@angular/core';
import {TaskService} from '../../../../core/services/task.service';
import {UserService} from '../../../../core/services/user.service';
import {ConfigurationService} from '../../../../core/services/configuration.service';
import {Task} from '../../../../../../../../libs/data/src/lib/tasks/models/tasks';
import {ActivatedRoute, Router} from '@angular/router';
import {Observable, Subscription, combineLatest, Subject} from 'rxjs';
import moment from 'moment';
import {User} from '../../../../../../../../libs/data/src/lib/users/models';
import * as _ from 'lodash';
import {MediaChange, MediaObserver} from '@angular/flex-layout';
import {map, takeUntil} from 'rxjs/operators';
import {IActiveDateElement} from '../../../../../../../../libs/data/src/lib/active-data-element.interface';
import {UpdateActiveDate} from '../../../../core/actions/active-date.actions';
import {stateActiveDateElement} from '../../../../../../../../libs/data/src/lib/state-active-date-element.enum';
import {Store} from '@ngrx/store';
import {AppStore} from '../../../../store';
import {selectActiveDate} from '../../../../core/selectors/active-date.selectors';


@Component({
    selector: 'tickist-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
    todayTasks: Task[] = [];
    overdueTasks: Task[] = [];
    tasks: Task[] = [];
    activeDateElement: IActiveDateElement;
    today: moment.Moment;
    stream$: Observable<any>;
    user: User;
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    mediaChange: MediaChange;

    constructor(private taskService: TaskService, protected route: ActivatedRoute, private  userService: UserService,
                private configurationService: ConfigurationService, protected router: Router,
                protected media: MediaObserver, private store: Store<AppStore>) {
        this.stream$ = combineLatest(
            this.taskService.tasks$,
            this.store.select(selectActiveDate),
            this.userService.user$
        );
        this.changeActiveDayAfterMidnight();
    }

    changeActiveDayAfterMidnight() {
        const today = new Date();
        const tommorow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        const timeToMidnight = (tommorow.getTime() - today.getTime());
        // this.timer = setTimeout(() => {
        //     if (this.isTomorrow()) {
        //         this.router.navigate(['/home']);
        //     }
        // }, timeToMidnight);
    }

    isToday(activeDateElement = this.activeDateElement) {
        const today = moment().format('DD-MM-YYYY');
        return (today === activeDateElement.date.format('DD-MM-YYYY'));
    }

    isTomorrow(activeDateElement = this.activeDateElement) {
        const tomorrow = moment().add(1, 'days').format('DD-MM-YYYY');
        return (tomorrow === activeDateElement.date.format('DD-MM-YYYY'));
    }

    ngOnInit() {
        this.stream$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(([tasks, activeDateElement, user]) => {
            this.activeDateElement = activeDateElement;
            this.user = user;
            if (tasks && tasks.length > 0 && this.user) {
                this.tasks = tasks.filter(task => task.owner.id === this.user.id && task.isDone === false);
                this.todayTasks = this.tasks.filter((task: Task) => {
                    return (
                        (task.finishDate && task.finishDate.format('DD-MM-YYYY') === this.activeDateElement.date.format('DD-MM-YYYY') ||
                            (task.pinned === true && this.isToday()))
                    );
                });

                this.overdueTasks = this.tasks.filter((task: Task) => {
                    return (task.pinned === false && task.finishDate && task.finishDate < this.activeDateElement.date);
                });

                const overdueTasksSortBy = JSON.parse(this.user.overdueTasksSortBy);
                this.todayTasks = _.orderBy(this.todayTasks,
                    ['priority', 'finishDate', 'finishTime', 'name'],
                    ['asc', 'desc', 'asc', 'asc']
                );
                this.overdueTasks = _.orderBy(this.overdueTasks, overdueTasksSortBy.fields, overdueTasksSortBy.orders);
            }
        });
        this.route.params.pipe(
            map(params => params['date']),
            takeUntil(this.ngUnsubscribe)
        ).subscribe((param) => {
            if (param) {
                this.store.dispatch(new UpdateActiveDate({date: param, state: stateActiveDateElement.weekdays}));
            }
        });
        this.media.media$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((mediaChange: MediaChange) => {
            this.mediaChange = mediaChange;
        });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
        // clearTimeout(this.timer);
    }

    navigateTo(path, arg) {
        this.router.navigate([path, arg]);
        if (this.media.isActive('sm') || this.media.isActive('xs')) {
            this.configurationService.changeOpenStateLeftSidenavVisibility('close');
        }
    }

}

