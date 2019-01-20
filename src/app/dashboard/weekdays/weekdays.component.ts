import {Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy} from '@angular/core';
import {ConfigurationService} from '../../services/configuration.service';
import {Task} from '../../models/tasks';
import {ActivatedRoute, Router} from '@angular/router';
import {Subject, Subscription} from 'rxjs';
import * as moment from 'moment';
import * as _ from 'lodash';
import {MediaChange, MediaObserver} from '@angular/flex-layout';
import {TaskService} from '../../tasks/task.service';
import {UserService} from '../../user/user.service';
import {User} from '../../user/models';
import {map, takeUntil} from 'rxjs/operators';
import {IActiveDateElement} from '../../models/active-data-element.interface';
import {Store} from '@ngrx/store';
import {AppStore} from '../../store';
import {selectAllUndoneTasks} from '../../tasks/task.selectors';


@Component({
    selector: 'tickist-weekdays-list',
    templateUrl: './weekdays.component.html',
    styleUrls: ['./weekdays.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WeekDaysComponent implements OnInit, OnDestroy {
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    activeDateElement: IActiveDateElement;
    today: moment.Moment;
    tasks: Task[] = [];
    week: Array<any> = [];
    subscriptions: Subscription;
    mediaChange: MediaChange;
    user: User;
    timer: any;

    constructor(private route: ActivatedRoute, private cd: ChangeDetectorRef, protected taskService: TaskService,
                private configurationService: ConfigurationService, protected router: Router, private store: Store<AppStore>,
                protected userService: UserService, protected media: MediaObserver) {

        this.regenerateWeekListAfterMidnight();
    }

    regenerateWeekListAfterMidnight() {
        const today = new Date();
        const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        const timeToMidnight = (tomorrow.getTime() - today.getTime());
        // this.timer = setTimeout(() => {
        //      this.feelWeekData();
        // }, timeToMidnight);
    }

    isToday(date: (moment.Moment | string) = this.activeDateElement.date): boolean {
        const today: moment.Moment = moment();
        if (moment.isMoment(date)) {
            date = (<string>(date.format('DD-MM-YYYY')));
        }
        return today.format('DD-MM-YYYY') === date;
    }

    ngOnInit(): void {

        this.route.params
            .pipe(
                takeUntil(this.ngUnsubscribe),
                map(params => params['date'])
            )
            .subscribe((param) => {
                this.configurationService.updateActiveDateElement(param);
            });
        this.media.media$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((mediaChange: MediaChange) => {
                this.mediaChange = mediaChange;
            });
        this.configurationService.activeDateElement$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((activeDateElement) => {
                this.activeDateElement = activeDateElement;
                this.cd.detectChanges();

            });
        this.store.select(selectAllUndoneTasks)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(tasks => {
                this.tasks = tasks;
                this.feelWeekData();
                this.cd.detectChanges();
            });

        this.userService.user$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(user => {
            this.user = user;
            this.feelWeekData();
            this.cd.detectChanges();
        });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
        this.cd.detach();
        // clearTimeout(this.timer);
    }

    isSelected(day): boolean {
        return (day.date === this.activeDateElement.date.format('DD-MM-YYYY'));
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

