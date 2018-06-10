import {Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy} from '@angular/core';
import {ConfigurationService} from '../../services/configurationService';
import {Task} from '../../models/tasks';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs';
import * as moment from 'moment';
import * as _ from 'lodash';
import {MediaChange, ObservableMedia} from '@angular/flex-layout';
import {TaskService} from '../../services/task-service';
import {UserService} from '../../services/userService';
import {User} from '../../models/user/user';
import {map} from 'rxjs/operators';


@Component({
    selector: 'app-dashboard',
    templateUrl: './weekdays.component.html',
    styleUrls: ['./weekdays.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WeekDaysComponent implements OnInit, OnDestroy {
    activeDay: moment.Moment;
    today: moment.Moment;
    tasks: Task[] = [];
    week: Array<any> = [];
    subscriptions: Subscription;
    mediaChange: MediaChange;
    user: User;
    timer: any;

    constructor(private route: ActivatedRoute, private cd: ChangeDetectorRef, protected taskService: TaskService,
                private configurationService: ConfigurationService, protected router: Router,
                protected userService: UserService, protected media: ObservableMedia) {

        this.regenerateWeekListAfterMidnight();
    }

    regenerateWeekListAfterMidnight() {
        const today = new Date();
        const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        const timeToMidnight = (tomorrow.getTime() - today.getTime());
        this.timer = setTimeout(() => {
             this.feelWeekData();
        }, timeToMidnight);
    }

    isToday(date: (moment.Moment | string) = this.activeDay) {
        const today: moment.Moment = moment();
        if (moment.isMoment(date)) {
            date = (<string>(date.format('DD-MM-YYYY')));
        }
        return (today.format('DD-MM-YYYY') === date);
    }

    ngOnInit() {
        this.subscriptions = this.route.params.pipe(map(params => params['date'])).subscribe((param) => {
            this.configurationService.updateActiveDay(param);
        });
        this.subscriptions.add(this.media.subscribe((mediaChange: MediaChange) => {
            this.mediaChange = mediaChange;
        }));
        this.subscriptions.add(this.configurationService.activeDay$.subscribe((activeDay) => {
            this.activeDay = activeDay;
            this.cd.detectChanges();

        }));
        this.subscriptions.add(this.taskService.tasks$.subscribe(tasks => {
            this.tasks = tasks;
            this.feelWeekData();
        }));
        
        this.subscriptions.add(this.userService.user$.subscribe(user => {
            this.user = user;
            this.feelWeekData();
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
        if (this.isToday(arg)) {
            this.router.navigate([path]);
        } else {
            this.router.navigate([path, arg]);
        }

        if (this.media.isActive('sm') || this.media.isActive('xs')) {
            this.configurationService.changeOpenStateLeftSidenavVisibility('close');
        }
    }

    chooseDay(date) {
        this.navigateTo('/home', date);
    }

    feelWeekData() {
        let nextDay = moment();
        const userId = _.get(this.user, 'id');
        this.week = [];
        if (!userId || this.tasks.length === 0) {
            return;
        }
        for (let i = 0; i < 7; i++) {
            this.week.push({
                'name': nextDay.format('dddd'),
                'date': nextDay.format('DD-MM-YYYY'),
                'tasksCounter': this.tasks.filter(task => {
                    return task.owner.id === userId && task.status === 0;
                })
                    .filter(task => {
                    const finishDate = task.finishDate;
                    const a = ((finishDate && (finishDate.format('DD-MM-YYYY') === nextDay.format('DD-MM-YYYY'))) ||
                        (this.isToday(nextDay) && task.pinned)
                    );
                    return a;
                }).length
            });
            nextDay = nextDay.add(1, 'days');
        }
    }

}

