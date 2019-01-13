import {Observable} from 'rxjs';
import {Injectable} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppStore} from '../store';
import {User} from '../models/user';
import * as _ from 'lodash';
import {MatSnackBar} from '@angular/material';
import {ConfigurationService} from './configuration.service';
import {TagService} from './tag.service';
import * as tasksAction from '../reducers/actions/tasks';
import {Filter} from '../models/filter';
import {HttpClient} from '@angular/common/http';
import {take} from 'rxjs/operators';
import {Task} from '../models/tasks';
import {Tag} from '../models/tags';


@Injectable()
export class TasksFiltersService {
    tasksFilters$: Observable<any>;
    currentTasksFilters$: Observable<any>;
    user: User;
    assignedToAll: Filter;
    assignedToMe: Filter;

    static useFilters(tasks, currentFilters) {
        tasks = tasks
            .filter(currentFilters[0].value)
            .filter(currentFilters[1].value)
            .filter(currentFilters[2].value)
            .filter(currentFilters[3].value);
        const tags = currentFilters.find(currentFilter => currentFilter.label === 'tags');
        const sortingBy = currentFilters.find(currentFilter => currentFilter.label === 'sorting');
        const searchTasks = currentFilters.find(currentFilter => currentFilter.label === 'searchTasks');
        if (tags.value instanceof Set) {
            tasks = tasks.filter((task: Task) => {
                const result = [];
                task.tags.forEach((tag: Tag) => {
                    if (tags.value.has(tag.id)) {
                        result.push(tag.id);
                    }
                });
                return result.length === tags.value.size;
            });
        } else if (tags.value === 'allTags') {
            tasks = tasks.filter((task) => {
                return !(task.tags.length === 0);
            });
        } else if (tags.value === 'withoutTags') {
            tasks = tasks.filter((task) => {
                return (task.tags.length === 0);
            });
        }
        if (searchTasks && searchTasks.value) {
            const re = new RegExp(searchTasks.value, 'i');
            tasks = tasks.filter((task) => re.test(task.name));
        }
        tasks = _.orderBy(tasks, sortingBy.sortKeys, sortingBy.order);
        return tasks;
    }

    constructor(public http: HttpClient, private store: Store<AppStore>,
                public snackBar: MatSnackBar, protected configurationService: ConfigurationService,
                protected tagService: TagService) {

        this.tasksFilters$ = this.store.pipe(
            select(s => s.tasksFilters)
        );
        this.currentTasksFilters$ = this.store.pipe(
            select(s => s.currentTasksFilters)
        );
    }

    createDefaultFilters(user) {
        this.user = user;

        this.assignedToMe = new Filter({
            id: user.id,
            label: 'assignedTo',
            value: task => task.owner.id === user.id,
            name: 'me',
            avatar: user.avatarUrl,
            fixed: true
        });
        this.assignedToAll = new Filter({
            id: 0,
            label: 'assignedTo',
            value: task => true,
            name: 'all',
            avatar: '/assets/default_avatar.png',
            fixed: true
        });
    }

    loadCurrentTasksFilters(user: User) {
        const filters = [
            new Filter({
                'id': 1,
                label: 'filter',
                'name': 'not done',
                'value': task => task.status === 0
            }),
            new Filter({
                'id': user.id,
                label: 'assignedTo',
                'value': task => task.owner.id === user.id,
                'name': 'me',
                'avatar': user.avatarUrl,
                'fixed': true
            }),
            new Filter({
                'id': 1,
                'value': task => task.estimateTime >= 0,
                label: 'estimateTime__lt',
                'name': '0'
            }),
            new Filter({
                id: 8,
                value: task => task.estimateTime <= 4294967296,
                label: 'estimateTime__gt',
                name: 'inf'
            }),
            new Filter({
                id: 1,
                label: 'sorting',
                value: 'priority',
                order: 'asc',
                name: 'priority <i class="fa fa-arrow-up"></i>'
            }),
            new Filter({
                'id': 1,
                label: 'tags',
                'value': 'allTasks',
                'name': 'all tasks'
            }),
            new Filter({
                'id': 1,
                label: 'searchTasks',
                value: '',
                name: ''
            })
        ];

        this.store.dispatch(new tasksAction.AddCurrentFilters(filters));
    }

    updateCurrentFilter(currentFilter) {
        this.store.dispatch(new tasksAction.UpdateCurrentFilter(currentFilter));
    }

    getCurrentTagsFilterValue() {
        let state: any;
        // we need to use 'synchronous' subscribe. It is only options to get current value
        this.currentTasksFilters$.pipe(take(1)).subscribe(s => state = s);
        return state.find(currentFilter => currentFilter.label === 'tags').value;
    }

    resetAssignedFilterToAssignedToAll() {
        this.updateCurrentFilter(this.assignedToAll);
    }

    resetAssignedFilterToAssignedToMe() {
        this.updateCurrentFilter(this.assignedToMe);
    }

    setAllTasksFilter() {
        this.updateCurrentFilter(new Filter({'id': 1, label: 'tags', 'value': 'allTasks', 'name': 'all tasks'}));
    }

    setAllTagsFilter() {
        // Temporary disabled
        // this.updateCurrentFilter(new Filter({'id': 1, label: 'tags', 'value': 'allTags', 'name': 'all tasks'}));
    }

    loadTasksFilters(user: User) {
        const filters = [
            {id: 1, label: 'filter', name: 'not done', value: task => task.status === 0},
            {id: 2, label: 'filter', name: 'w/o due date', value: task => task.finishDate !== ''},
            {
                id: 3,
                label: 'filter',
                name: 'w/o estimated time',
                value: task => task.estimateTime === null
            },
            {id: 4, label: 'filter', name: 'on hold', value: task => task.status === 2},
            {
                id: user.id,
                label: 'assignedTo',
                value: task => task.owner.id === user.id,
                name: 'me',
                avatar: user.avatarUrl,
                fixed: true
            },
            {
                id: 0,
                label: 'assignedTo',
                value: task => true,
                name: 'all',
                avatar: '/assets/default_avatar.png',
                fixed: true
            },
            {id: 1, value: task => task.estimateTime >= 0, label: 'estimateTime__lt', name: '0'},
            {id: 2, value: task => task.estimateTime >= 15, label: 'estimateTime__lt', name: '15m'},
            {id: 3, value: task => task.estimateTime >= 30, label: 'estimateTime__lt', name: '30m'},
            {id: 4, value: task => task.estimateTime >= 60, label: 'estimateTime__lt', name: '1h'},
            {id: 5, value: task => task.estimateTime >= 120, label: 'estimateTime__lt', name: '2h'},
            {id: 6, value: task => task.estimateTime >= 240, label: 'estimateTime__lt', name: '41h'},
            {id: 7, value: task => task.estimateTime >= 480, label: 'estimateTime__lt', name: '8h'},
            {id: 8, value: task => task.estimateTime >= 4294967296, label: 'estimateTime__lt', name: 'inf'},
            {id: 1, value: task => task.estimateTime <= 0, label: 'estimateTime__gt', name: '0'},
            {id: 2, value: task => task.estimateTime <= 15, label: 'estimateTime__gt', name: '15m'},
            {id: 3, value: task => task.estimateTime <= 30, label: 'estimateTime__gt', name: '30m'},
            {id: 4, value: task => task.estimateTime <= 60, label: 'estimateTime__gt', name: '1h'},
            {id: 5, value: task => task.estimateTime <= 120, label: 'estimateTime__gt', name: '2h'},
            {id: 6, value: task => task.estimateTime <= 240, label: 'estimateTime__gt', name: '4h'},
            {id: 7, value: task => task.estimateTime <= 480, label: 'estimateTime__gt', name: '8h'},
            {id: 8, value: task => task.estimateTime <= 4294967296, label: 'estimateTime__gt', name: 'inf'},
            {
                id: 1,
                label: 'sorting',
                sortKeys: ['priority'],
                order: ['desc'],
                name: 'priority <i class="fa fa-arrow-up"></i>'
            },
            {
                id: 2,
                label: 'sorting',
                sortKeys: ['finish_date_obj', 'finishTime'],
                order: ['asc', 'desc'],
                name: 'due date <i class="fa fa-arrow-up"></i>'
            },
            {
                id: 3,
                label: 'sorting',
                sortKeys: ['creation_date'],
                order: ['asc'],
                name: 'creation date <i class="fa fa-arrow-up"></i>'
            },
            {id: 4, label: 'sorting', sortKeys: ['name'], order: ['asc'], name: 'A-Z <i class="fa fa-arrow-up"></i>'},
            {
                id: 5,
                label: 'sorting',
                sortKeys: ['priority'],
                order: ['asc'],
                name: 'priority <i class="fa fa-arrow-down"></i>'
            },
            {
                id: 6,
                label: 'sorting',
                sortKeys: ['finish_date_obj', 'finishTime'],
                order: ['desc', 'asc'],
                name: 'due date <i class="fa fa-arrow-down"></i>'
            },
            {
                id: 7,
                label: 'sorting',
                sortKeys: ['creation_date'],
                order: ['desc'],
                name: 'creation date  <i class="fa fa-arrow-down"></i>'
            },
            {id: 8, label: 'sorting', sortKeys: ['name'], order: ['desc'], name: 'A-Z <i class="fa fa-arrow-down"></i>'},
            {id: 1, label: 'tags', value: 1},
            {
                'id': 1,
                label: 'searchTasks',
                value: '',
                name: ''
            }
        ].map(filter => new Filter(filter));

        this.store.dispatch(new tasksAction.AddFilters(filters));
    }

}
