import {Component, OnDestroy, OnInit} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {TagService} from '../../../../core/services/tag.service';
import {Tag} from '@data/tags/models/tags';
import {Task} from '@data/tasks/models/tasks';
import {TaskService} from '../../../../core/services/task.service';
import {UserService} from '../../../../core/services/user.service';
import {User} from '@data/users/models';
import {ConfigurationService} from '../../../../core/services/configuration.service';
import {TasksFiltersService} from '../../../../core/services/tasks-filters.service';
import {AppStore} from '../../../../store';
import {Store} from '@ngrx/store';
import {selectTasksStreamInTagsView} from '../../../../core/selectors/task.selectors';
import {selectLoggedInUser} from '../../../../core/selectors/user.selectors';
import {takeUntil} from 'rxjs/operators';
import {UpdateUser} from '../../../../core/actions/user.actions';

@Component({
    selector: 'tickist-tags',
    templateUrl: './tags.component.html',
    styleUrls: ['./tags.component.scss']
})
export class TagsComponent implements OnInit, OnDestroy {
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    tags: Tag[];
    tasks: Task[];
    tasks$: Observable<Task[]>;
    user: User;
    defaultTaskView: string;
    taskView: string;

    constructor(private tagService: TagService, private  taskService: TaskService, private tasksFiltersService: TasksFiltersService,
                private userService: UserService, private store: Store<AppStore>, private configurationService: ConfigurationService) {
        this.defaultTaskView = this.configurationService.TASK_EXTENDED_VIEW.value;

    }

    ngOnInit() {
        this.tasks$ = this.store.select(selectTasksStreamInTagsView);
        this.store.select(selectLoggedInUser)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((user) => {
                this.user = user;
            });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
        // clearTimeout(this.timer);
    }

    changeTaskView(event) {
        this.taskView = event;
        if (this.user.defaultTaskViewTagsView !== event) {
            const user = Object.assign({}, this.user, {defaultTaskViewTodayView: event});
            this.store.dispatch(new UpdateUser({user}));
        }
    }

    trackByFn(index, item): number {
        return item.id;
    }
}
