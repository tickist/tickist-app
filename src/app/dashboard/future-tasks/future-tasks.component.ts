import {Component, OnInit} from '@angular/core';
import {TaskService} from '../../services/task-service';
import {combineLatest, Observable, Subject} from 'rxjs';
import {map, takeUntil} from 'rxjs/operators';
import {ActivatedRoute, Router} from '@angular/router';
import {ConfigurationService} from '../../services/configurationService';
import {Task} from '../../models/tasks';
import * as _ from 'lodash';
import {User} from '../../models/user';
import {UserService} from '../../services/userService';
import {IActiveDateElement} from '../../models/active-data-element.interface';

@Component({
    selector: 'tickist-future-tasks',
    templateUrl: './future-tasks.component.html',
    styleUrls: ['./future-tasks.component.scss']
})
export class FutureTasksComponent implements OnInit {
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    tasks: Task[];
    user: User;
    stream$: Observable<any>;
    activeDateElement: IActiveDateElement;
    futureTasks: Task[];
    taskView: string;
    defaultTaskView: string;

    constructor(private taskService: TaskService, private route: ActivatedRoute, private router: Router,
                private configurationService: ConfigurationService, private userService: UserService) {
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
    }

    ngOnInit(): void {
        this.stream$.subscribe((tasks) => {
            if (tasks && tasks.length > 0 && this.user && this.activeDateElement) {
                this.defaultTaskView = this.user.defaultTaskViewFutureView;
                this.futureTasks = tasks.filter(task => {
                    return task.owner.id === this.user.id
                    && task.status === 0
                    && task.finishDate
                    && task.finishDate.month() === this.activeDateElement.date.month()
                    && task.finishDate.year() === this.activeDateElement.date.year();
                });

                const futureTasksSortBy = JSON.parse(this.user.futureTasksSortBy);
                this.futureTasks = _.orderBy(this.futureTasks, futureTasksSortBy.fields, futureTasksSortBy.orders);
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

}
