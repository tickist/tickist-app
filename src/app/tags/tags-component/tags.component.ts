import {Component, OnDestroy, OnInit} from '@angular/core';
import {Observable, Subscription, combineLatest} from 'rxjs';
import {TagService} from '../../services/tag.service';
import {Tag} from '../../models/tags';
import {Task} from '../../models/tasks';
import {TaskService} from '../../services/task.service';
import {UserService} from '../../services/user.service';
import {User} from '../../models/user';
import {SideNavVisibility} from '../../models';
import {ConfigurationService} from '../../services/configuration.service';
import {TasksFiltersService} from '../../services/tasks-filters.service';

@Component({
    selector: 'app-tags',
    templateUrl: './tags.component.html',
    styleUrls: ['./tags.component.scss']
})
export class TagsComponent implements OnInit, OnDestroy {
    tags: Tag[];
    tasks: Task[];
    user: User;
    tasksStream$: Observable<any>;
    tagsStream$: Observable<any>;
    defaultTaskView: string;
    taskView: string;
    leftSidenavVisibility: SideNavVisibility;
    rightSidenavVisibility: SideNavVisibility;
    subscriptions: Subscription;

    constructor(private tagService: TagService, private  taskService: TaskService, private tasksFiltersService: TasksFiltersService,
                private userService: UserService, private configurationService: ConfigurationService) {

    }

    ngOnInit() {
        this.tagsStream$ = combineLatest(
            this.tagService.tags$,
            this.tasksFiltersService.currentTasksFilters$,
            (tags: Tag[], currentTasksFilters: any) => {
                return tags;
            }
        );
        this.tasksStream$ = combineLatest(
            this.taskService.tasks$,
            this.tasksFiltersService.currentTasksFilters$,
            (tasks: Task[], currentTasksFilters: any) => {
                if (currentTasksFilters.length > 0) {
                    tasks = TasksFiltersService.useFilters(tasks, currentTasksFilters);
                }
                return tasks;
            }
        );
        this.subscriptions = this.tagsStream$.subscribe((tags) => {
            if (tags) {
                this.tags = tags;
            }
        });
        this.subscriptions.add(this.tasksStream$.subscribe(((tasks) => {
            if (tasks) {
                this.tasks = tasks;
            }
        })));
        this.subscriptions.add(this.userService.user$.subscribe((user) => {
            this.user = user;
        }));
    }

    ngOnDestroy() {
        if (this.subscriptions) {
            this.subscriptions.unsubscribe();
        }
    }

    changeTaskView(event) {
        console.log(event);
        this.taskView = event;
        if (this.user.defaultTaskViewTagsView !== event) {
            this.user.defaultTaskViewTagsView = event;
            this.userService.updateUser(this.user, true);
        }
    }

    trackByFn(index, item): number {
        return item.id;
    }
}
