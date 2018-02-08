import {Component, OnInit, OnDestroy} from '@angular/core';
import {TaskService} from '../services/taskService';
import {UserService} from '../services/userService';
import {ConfigurationService} from '../services/configurationService';
import {Task} from '../models/tasks';
import {ActivatedRoute, Router} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/combineLatest';
import {Subscription} from 'rxjs/Subscription';
import * as moment from 'moment';
import {User} from '../models/user';
import {SideNavVisibility} from '../models/configurations';
import * as _ from 'lodash';
import {MediaChange, ObservableMedia} from '@angular/flex-layout';


@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
    todayTasks: Task[] = [];
    overdueTasks: Task[] = [];
    futureTasks: Task[] = [];
    tasks: Task[] = [];
    activeDay: moment.Moment;
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
        this.stream$ = Observable
            .combineLatest(
                this.taskService.tasks$,
                this.configurationService.activeDay$,
                this.userService.user$,
                (tasks: Task[], activeDay: any, user: User) => {
                    this.activeDay = activeDay;
                    this.user = user;
                    return tasks;
                }
            );
        this.changeActiveDayAfterMidnight();
    }

    changeActiveDayAfterMidnight() {
        const today = new Date();
        const tommorow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        const timeToMidnight = (tommorow - today);
        this.timer = setTimeout(() => {
             this.router.navigate(['/home']);
        }, timeToMidnight);
    }

    isToday(date = this.activeDay) {
        const today = moment().format('DD-MM-YYYY');
        return (today === date.format('DD-MM-YYYY'));
    }

    ngOnInit() {

        this.subscriptions = this.stream$.subscribe((tasks) => {
            if (tasks && tasks.length > 0 && this.user) {
                this.tasks = tasks.filter(task => task.owner.id === this.user.id && task.status === 0);
                this.todayTasks = this.tasks.filter((task: Task) => {
                    return (
                        (task.finishDate && task.finishDate.format('DD-MM-YYYY') === this.activeDay.format('DD-MM-YYYY') ||
                        (task.pinned === true && this.isToday()))
                    );
                });

                this.overdueTasks = this.tasks.filter((task: Task) => {
                    return ( task.pinned === false && task.finishDate && task.finishDate < this.activeDay);
                });

                this.futureTasks = this.tasks.filter((task: Task) => {
                    return ( task.pinned === false && task.typeFinishDate === 0 && task.finishDate && task.finishDate > this.activeDay);
                });

                this.todayTasks = _.sortBy(this.todayTasks, ['priority', 'name']);
                this.overdueTasks = _.sortBy(this.overdueTasks, ['priority', 'finishDate', 'name']);
                this.futureTasks = _.sortBy(this.futureTasks, ['finishDate', 'finishTime', 'name']);
                this.feelWeekData();
            }
        });
        this.subscriptions.add(this.route.params.map(params => params['date']).subscribe((param) => {
            this.configurationService.updateActiveDay(param);
        }));
        this.subscriptions.add(this.media.subscribe((mediaChange: MediaChange) => {
            console.log(mediaChange);
            this.mediaChange = mediaChange;
        }));
    }

    ngOnDestroy() {
        if (this.subscriptions) {
            this.subscriptions.unsubscribe();
        }
        clearTimeout(this.timer);
    }

    isSelected(day) {
        return (day.date === this.activeDay.format('DD-MM-YYYY'));

    }

    navigateTo(path, arg) {
        this.router.navigate([path, arg]);
        if (this.media.isActive('sm') || this.media.isActive('xs')) {
            this.configurationService.changeOpenStateLeftSidenavVisibility('close');
        }
    }

    feelWeekData() {
        let nextDay = moment();
        this.week = [];
        for (let i = 0; i < 7; i++) {
            this.week.push({
                'name': nextDay.format('dddd'),
                'date': nextDay.format('DD-MM-YYYY'),
                'tasksCounter': this.tasks.filter(task => {
                    const finishDate = task.finishDate;
                    return (
                        (finishDate && (finishDate.format('DD-MM-YYYY') === nextDay.format('DD-MM-YYYY'))) ||
                        (this.isToday(nextDay) && task.pinned)
                    );
                }).length
            });
            nextDay = nextDay.add(1, 'days');
        }
    }

}

