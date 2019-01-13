import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {TaskService} from '../../services/task.service';
import {combineLatest, Observable, Subject} from 'rxjs';
import {map, takeUntil} from 'rxjs/operators';
import {ActivatedRoute, Router} from '@angular/router';
import {ConfigurationService} from '../../services/configuration.service';
import {Task} from '../../models/tasks';
import * as _ from 'lodash';
import {User} from '../../user/models';
import {UserService} from '../../services/user.service';
import {IActiveDateElement} from '../../models/active-data-element.interface';
import {Filter} from '../../models/filter';
import {FutureTasksFiltersService} from '../../services/future-tasks-filters.service';

@Component({
    selector: 'tickist-future-tasks',
    templateUrl: './future-tasks.component.html',
    styleUrls: ['./future-tasks.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FutureTasksComponent implements OnInit, OnDestroy {
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    tasks: Task[] = [];
    user: User;
    stream$: Observable<any>;
    activeDateElement: IActiveDateElement;
    futureTasks: Task[] = [];
    taskView: string;
    defaultTaskView: string;
    currentFilter: Filter;

    constructor(private taskService: TaskService, private route: ActivatedRoute, private router: Router,
                private configurationService: ConfigurationService, private userService: UserService,
                private futureTasksFiltersService: FutureTasksFiltersService, private cd: ChangeDetectorRef) {
        this.stream$ = combineLatest(
            this.taskService.tasks$,
            this.configurationService.activeDateElement$,
            this.userService.user$,
            this.futureTasksFiltersService.currentFutureTasksFilters$
        );
    }

    ngOnInit(): void {
        this.stream$.subscribe(([tasks, activeDateElement, user, currentFilter]) => {
            this.activeDateElement = activeDateElement;
            this.user = user;
            this.currentFilter = currentFilter;
            if (tasks && tasks.length > 0 && this.user && this.activeDateElement && this.currentFilter) {
                this.defaultTaskView = this.user.defaultTaskViewFutureView;
                this.futureTasks = tasks.filter(task => {
                    return task.owner.id === this.user.id
                    && task.status === 0
                    && task.finishDate
                    && task.finishDate.month() === this.activeDateElement.date.month()
                    && task.finishDate.year() === this.activeDateElement.date.year();
                });
                this.futureTasks = this.futureTasks.filter(this.currentFilter.value);
                const futureTasksSortBy = JSON.parse(this.user.futureTasksSortBy);
                this.futureTasks = _.orderBy(this.futureTasks, futureTasksSortBy.fields, futureTasksSortBy.orders);
                this.cd.detectChanges();
            }
        });

        this.route.params
            .pipe(map(params => params['date']))
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((param) => {
                this.configurationService.updateActiveDateElement(param);
            });
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    changeTaskView(event): void {
        if (!event) return;
        this.taskView = event;
        if (this.user.defaultTaskViewFutureView !== event) {
            this.user.defaultTaskViewFutureView = event;
            this.userService.updateUser(this.user, true);
        }

    }

    trackByFn(index, item) {
        return item.id;
    }

}
