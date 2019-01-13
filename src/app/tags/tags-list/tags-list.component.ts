import {Component, OnDestroy, OnInit} from '@angular/core';
import {Observable, Subscription, combineLatest} from 'rxjs';
import {TagService} from '../../services/tag.service';
import {Tag} from '../../models/tags';
import {Task} from '../../models/tasks';
import {TaskService} from '../../services/task.service';
import {FormBuilder, Validators, FormGroup, FormControl} from '@angular/forms';
import {UserService} from '../../services/user.service';
import {User} from '../../user/models';
import {ConfigurationService} from '../../services/configuration.service';
import {FilterTagsDialogComponent} from '../filter-tags-dialog/filter-tags-dialog.component';
import {MatDialog} from '@angular/material';
import {TagsFiltersService} from '../../services/tags-filters.service';
import {Filter} from '../../models/filter';
import {TasksFiltersService} from '../../services/tasks-filters.service';
import * as _ from 'lodash';

@Component({
    selector: 'app-tags-list',
    templateUrl: './tags-list.component.html',
    styleUrls: ['./tags-list.component.scss']
})
export class TagsListComponent implements OnInit, OnDestroy {
    tags: Tag[];
    tasks: Task[];
    user: User;
    tasksStream$: Observable<any>;
    tagsStream$: Observable<any>;
    createTagForm: FormGroup;
    defaultTaskView: string;
    taskView: string;
    currentTagsFilters: Filter;
    subscriptions: Subscription;

    constructor(private fb: FormBuilder, private tagService: TagService, private  taskService: TaskService,
                protected userService: UserService, protected configurationService: ConfigurationService,
                public dialog: MatDialog, protected tagsFiltersService: TagsFiltersService,
                protected tasksFiltersService: TasksFiltersService) {

    }

    ngOnInit(): void {
        this.tagsStream$ = combineLatest(
            this.tagService.tags$,
            this.tasksFiltersService.currentTasksFilters$,
            this.tagsFiltersService.currentTagsFilters$,
            (tags: Tag[], currentTasksFilters: any, currentTagsFilters: any) => {
                this.currentTagsFilters = currentTagsFilters;
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
                if (this.currentTagsFilters) {
                    tags = tags.filter(this.currentTagsFilters.value);
                }
                this.tags = _.orderBy(tags, 'name', 'asc');
            }
        });
        this.subscriptions.add(this.tasksStream$.subscribe(((tasks) => {
            if (tasks) {
                this.tasks = tasks;
            }
        })));
        this.createTagForm = new FormGroup({
            'name': new FormControl('', Validators.required)
        });
        this.subscriptions.add(this.userService.user$.subscribe((user) => {
            this.user = user;
        }));
    }

    ngOnDestroy(): void {
        if (this.subscriptions) {
            this.subscriptions.unsubscribe();
        }
    }

    createTag(values): void {
        if (this.createTagForm.valid) {
            this.tagService.createTag(new Tag({name: values['name']}));
            this.createTagForm.reset();
        }

    }

    private isInt(value): boolean {
        // @TODO DRY
        return !isNaN(value) && (function (x) {
            return (x | 0) === x;
        })(parseFloat(value));
    }
    
    changeTaskView(event): void {
        console.log(event);
        this.taskView = event;
    }

    trackByFn(index, item): number {
        return item.id;
    }

    openFilterDialog(): void {
        const dialogRef = this.dialog.open(FilterTagsDialogComponent);
        dialogRef.afterClosed().subscribe(result => {
            if (result) {

            }
        });
    }

}
