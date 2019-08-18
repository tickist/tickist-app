import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {FutureListElement} from './models';
import moment from 'moment';
import {ActivatedRoute, Router} from '@angular/router';
import {ConfigurationService} from '../../../../core/services/configuration.service';
import {MediaObserver} from '@angular/flex-layout';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {IActiveDateElement} from '../../../../../../../../libs/data/src/lib/active-data-element.interface';
import {TaskService} from '../../../../core/services/task.service';
import {Task} from '../../../../../../../../libs/data/src/lib/tasks/models/tasks';
import {UserService} from '../../../../core/services/user.service';
import {User} from '../../../../../../../../libs/data/src/lib/users/models';
import {stateActiveDateElement} from '../../../../../../../../libs/data/src/lib/state-active-date-element.enum';
import {dashboardRoutesName} from '../../../dashboard/routes.names';
import {futureTasksRoutesName} from '../../../future-tasks/routes.names';
import {selectActiveDate} from '../../../../core/selectors/active-date.selectors';
import {Store} from '@ngrx/store';
import {AppStore} from '../../../../store';

@Component({
    selector: 'tickist-future-list',
    templateUrl: './future-list.component.html',
    styleUrls: ['./future-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FutureListComponent implements OnInit, OnDestroy {
    futureList: FutureListElement[];
    monthsRequired = 12;
    activeDateElement: IActiveDateElement;
    tasks: Task[];
    user: User;
    stateActiveDateElement = stateActiveDateElement;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(private route: ActivatedRoute, private router: Router, private store: Store<AppStore>,
                private media: MediaObserver, private taskService: TaskService, private userService: UserService,
                private cd: ChangeDetectorRef) {
    }

    ngOnInit(): void {
        this.store.select(selectActiveDate)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((activeDateElement: IActiveDateElement) => {
                this.activeDateElement = activeDateElement;
                this.cd.detectChanges();
            });
        this.taskService.tasks$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((tasks: Task[]) => {
            this.tasks = tasks;
            this.futureList = this.createFutureList();
            this.cd.detectChanges();
        });
        this.userService.user$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((user: User) => {
            this.user = user;
            this.futureList = this.createFutureList();
            this.cd.detectChanges();
        });
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    private createFutureList(): FutureListElement[] {
        if (!this.tasks.length || !this.user) return [];
        const futureList = [];
        for (let i = 0; i <= this.monthsRequired; i++) {
            const momentDate = moment().add(i, 'months');
            futureList.push({
                'url': momentDate.format('MMMM-YYYY'),
                'label': momentDate.format('MMMM YYYY'),
                'tasksCounter': this.tasks.filter(task => {
                    return task.owner.id === this.user.id
                        && task.isDone === false
                        && task.finishDate
                        && task.finishDate.month() === momentDate.month()
                        && task.finishDate.year() === momentDate.year();
                }).length
            });
        }

        return futureList;
    }

    isSelected(elem: FutureListElement) {
        return this.activeDateElement.state === this.stateActiveDateElement.future
            && elem.url === this.activeDateElement.date.format('MMMM-YYYY');
    }

    navigateTo(path, arg) {
        // @TODO please fix it
        if (false) {
            this.router.navigate([path]);
        } else {
            // this.router.navigate(['home/' + futureTasksRoutesName.FUTURE_TASKS, {outlets: {content: [arg]}}]);
            this.router.navigate(['home', {outlets: {content: [futureTasksRoutesName.FUTURE_TASKS, arg]}}]);
        }
        if (this.media.isActive('sm') || this.media.isActive('xs')) {
            // @TODO add action
            // this.contentfigurationService.changeOpenStateLeftSidenavVisibility('close');
        }
    }

}

