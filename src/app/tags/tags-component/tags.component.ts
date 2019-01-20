import {Component, OnDestroy, OnInit} from '@angular/core';
import {Observable, Subscription, combineLatest, Subject} from 'rxjs';
import {TagService} from '../../services/tag.service';
import {Tag} from '../../models/tags';
import {Task} from '../../models/tasks';
import {TaskService} from '../../tasks/task.service';
import {UserService} from '../../user/user.service';
import {User} from '../../user/models';
import {SideNavVisibility} from '../../models';
import {ConfigurationService} from '../../services/configuration.service';
import {TasksFiltersService} from '../../tasks/tasks-filters.service';
import {AppStore} from '../../store';
import {Store} from '@ngrx/store';
import {selectAllTags} from '../tags.selectors';
import {selectTasksStreamInTagsView} from '../../tasks/task.selectors';
import {selectLoggedInUser} from '../../user/user.selectors';
import {takeUntil} from 'rxjs/operators';
import {UpdateUser} from '../../user/user.actions';

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
    tasksStream$: Observable<any>;
    tagsStream$: Observable<any>;
    defaultTaskView: string;
    taskView: string;
    leftSidenavVisibility: SideNavVisibility;
    rightSidenavVisibility: SideNavVisibility;

    constructor(private tagService: TagService, private  taskService: TaskService, private tasksFiltersService: TasksFiltersService,
                private userService: UserService, private store: Store<AppStore>) {

    }

    ngOnInit() {
        this.tagsStream$ = combineLatest(
            this.store.select(selectAllTags),
            this.tasksFiltersService.currentTasksFilters$
        );
        this.tasks$ = this.store.select(selectTasksStreamInTagsView);
        this.tasksStream$ = combineLatest(
            this.taskService.tasks$,
            this.tasksFiltersService.currentTasksFilters$
        );
        this.tagsStream$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(([tags]) => {
                if (tags) {
                    this.tags = tags;
                }
            });
        this.tasksStream$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((([tasks, currentTasksFilters]) => {
                if (currentTasksFilters.length > 0) {
                    tasks = TasksFiltersService.useFilters(tasks, currentTasksFilters);
                }
                if (tasks) {
                    this.tasks = tasks;
                }
            }));
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
