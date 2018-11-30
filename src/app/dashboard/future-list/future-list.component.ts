import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {FutureListElement} from './models';
import * as moment from 'moment';
import {ActivatedRoute, Router} from '@angular/router';
import {ConfigurationService} from '../../services/configuration.service';
import {ObservableMedia} from '@angular/flex-layout';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {IActiveDateElement} from '../../models/active-data-element.interface';
import {TaskService} from '../../services/task.service';
import {Task} from '../../models/tasks';
import {UserService} from '../../services/user.service';
import {User} from '../../models/user';
import {stateActiveDateElement} from '../../models/state-active-date-element.enum';

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

    constructor(private route: ActivatedRoute, private router: Router, private configurationService: ConfigurationService,
                private media: ObservableMedia, private taskService: TaskService, private userService: UserService,
                private cd: ChangeDetectorRef) {
    }

    ngOnInit(): void {
        this.configurationService
            .activeDateElement$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((activeDateElement: IActiveDateElement) => {
                this.activeDateElement = activeDateElement;
                this.cd.detectChanges();
            });
        this.taskService.tasks$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((tasks: Task[]) => {
            this.tasks = tasks;
            this.futureList = this.createFutureList();
        });
        this.userService.user$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((user: User) => {
            this.user = user;
            this.futureList = this.createFutureList();
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
                        && task.status === 0
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
            this.router.navigate([path, arg]);
        }

        if (this.media.isActive('sm') || this.media.isActive('xs')) {
            this.configurationService.changeOpenStateLeftSidenavVisibility('close');
        }
    }

}

