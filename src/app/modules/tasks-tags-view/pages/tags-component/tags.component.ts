import {Component, OnDestroy, OnInit} from '@angular/core';
import {Observable, Subscription, combineLatest, Subject} from 'rxjs';
import {TagService} from '../../../../services/tag.service';
import {Tag} from '../../../../models/tags';
import {Task} from '../../../../models/tasks';
import {TaskService} from '../../../../core/services/task.service';
import {UserService} from '../../../../core/services/user.service';
import {User} from '../../../../core/models';
import {SideNavVisibility} from '../../../../models';
import {ConfigurationService} from '../../../../services/configuration.service';
import {TasksFiltersService} from '../../../../core/services/tasks-filters.service';
import {AppStore} from '../../../../store';
import {Store} from '@ngrx/store';
import {selectAllTags} from '../../../../core/selectors/tags.selectors';
import {selectTasksStreamInTagsView} from '../../../../core/selectors/task.selectors';
import {selectLoggedInUser} from '../../../../core/selectors/user.selectors';
import {takeUntil} from 'rxjs/operators';
import {UpdateUser} from '../../../../core/actions/user.actions';

@Component({
    selector: 'app-tags',
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
        // this.tasksStream$ = combineLatest(
        //     this.taskService.tasks$,
        //     this.tasksFiltersService.currentTasksFilters$
        // );
        // this.tagsStream$
        //     .pipe(takeUntil(this.ngUnsubscribe))
        //     .subscribe(([tags]) => {
        //         if (tags) {
        //             this.tags = tags;
        //         }
        //     });
        // this.tasksStream$
        //     .pipe(takeUntil(this.ngUnsubscribe))
        //     .subscribe((([tasks, currentTasksFilters]) => {
        //         if (currentTasksFilters && currentTasksFilters.length > 0) {
        //             tasks = TasksFiltersService.useFilters(tasks, currentTasksFilters);
        //         }
        //         if (tasks) {
        //             this.tasks = tasks;
        //         }
        //     }));
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
            this.user.defaultTaskViewTagsView = event;
            this.store.dispatch(new UpdateUser({user: this.user, snackBar: true, progressBar: true}));
        }
    }

    trackByFn(index, item): number {
        return item.id;
    }
}
