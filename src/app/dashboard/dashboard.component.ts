import {Component, OnInit, OnDestroy} from '@angular/core';
import {TaskService} from '../services/task.service';
import {UserService} from '../services/user.service';
import {ConfigurationService} from '../services/configuration.service';
import {Task} from '../models/tasks';
import {ActivatedRoute, Router} from '@angular/router';
import {Observable, Subscription, combineLatest} from 'rxjs';
import * as moment from 'moment';
import {User} from '../models/user';
import * as _ from 'lodash';
import {MediaChange, ObservableMedia} from '@angular/flex-layout';
import {map} from 'rxjs/operators';
import {IActiveDateElement} from '../models/active-data-element.interface';


@Component({
    selector: 'tickist-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
    todayTasks: Task[] = [];
    overdueTasks: Task[] = [];
    futureTasks: Task[] = [];
    tasks: Task[] = [];
    activeDateElement: IActiveDateElement;
    today: moment.Moment;
    stream$: Observable<any>;
    week: Array<any> = [];
    user: User;
    timer: any;

    subscriptions: Subscription;
    mediaChange: MediaChange;

    constructor(private taskService: TaskService, protected route: ActivatedRoute, private  userService: UserService,
                private configurationService: ConfigurationService, protected router: Router,
                protected media: ObservableMedia) {
        this.stream$ = combineLatest(
                this.taskService.tasks$,
                this.configurationService.activeDateElement$,
                this.userService.user$,
                (tasks: Task[], activeDateElement: IActiveDateElement, user: User) => {
                    this.activeDateElement = activeDateElement;
                    this.user = user;
                    return tasks;
                }
            );
        this.changeActiveDayAfterMidnight();
    }

    changeActiveDayAfterMidnight() {
        const today = new Date();
        const tommorow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        const timeToMidnight = (tommorow.getTime() - today.getTime());
        this.timer = setTimeout(() => {
            if (this.isTomorrow()) {
                this.router.navigate(['/home']);
            }
        }, timeToMidnight);
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
        this.subscriptions = this.stream$.subscribe((tasks) => {
            if (tasks && tasks.length > 0 && this.user) {
                this.tasks = tasks.filter(task => task.owner.id === this.user.id && task.status === 0);
                this.todayTasks = this.tasks.filter((task: Task) => {
                    return (
                        (task.finishDate && task.finishDate.format('DD-MM-YYYY') === this.activeDateElement.date.format('DD-MM-YYYY') ||
                        (task.pinned === true && this.isToday()))
                    );
                });

                this.overdueTasks = this.tasks.filter((task: Task) => {
                    return ( task.pinned === false && task.finishDate && task.finishDate < this.activeDateElement.date);
                });

                const overdueTasksSortBy = JSON.parse(this.user.overdueTasksSortBy);
                this.todayTasks = _.orderBy(this.todayTasks,
                    ['priority', 'finishDate', 'finishTime', 'name'],
                    ['asc', 'desc', 'asc', 'asc']
                );
                this.overdueTasks = _.orderBy(this.overdueTasks, overdueTasksSortBy.fields, overdueTasksSortBy.orders);
            }
        });
        this.subscriptions.add(this.route.params.pipe(map(params => params['date'])).subscribe((param) => {
            this.configurationService.updateActiveDateElement(param);
        }));
        this.subscriptions.add(this.media.subscribe((mediaChange: MediaChange) => {
            this.mediaChange = mediaChange;
        }));
    }

    ngOnDestroy() {
        if (this.subscriptions) {
            this.subscriptions.unsubscribe();
        }
        clearTimeout(this.timer);
    }

    navigateTo(path, arg) {
        this.router.navigate([path, arg]);
        if (this.media.isActive('sm') || this.media.isActive('xs')) {
            this.configurationService.changeOpenStateLeftSidenavVisibility('close');
        }
    }

}

