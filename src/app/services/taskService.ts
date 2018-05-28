import {Observable, pipe} from 'rxjs';
import {Injectable} from '@angular/core';
import {Store, State} from '@ngrx/store';
import {environment} from '../../environments/environment';
import {AppStore} from '../store';
import {Task} from '../models/tasks';
import {UserService} from './userService';
import {User} from '../models/user';
import * as _ from 'lodash';
import {MatSnackBar} from '@angular/material';
import {StatisticsService} from './statisticsService';
import {ConfigurationService} from './configurationService';
import {TagService} from './tagService';
import {ProjectService} from './projectService';
import * as tasksAction from '../reducers/actions/tasks';
import {Filter} from '../models/filter';
import {HttpClient} from '@angular/common/http';
import {filter, map, take} from 'rxjs/operators';


@Injectable()
export class TaskService {
    tasks$: Observable<Task[]>;
    tasksFilters$: Observable<any>;
    currentTasksFilters$: Observable<any>;

    static useFilters(tasks, currentFilters) {

        tasks = tasks.filter(currentFilters[0].value);
        tasks = tasks.filter(currentFilters[1].value);
        tasks = tasks.filter(currentFilters[2].value);
        tasks = tasks.filter(currentFilters[3].value);
        const tags = currentFilters.filter(filter => filter.label === 'tags')[0];
        const sortingBy = currentFilters.filter(filter => filter.label === 'sorting')[0];

        if (tags.value instanceof Array) {
            tasks = tasks.filter((task) => {
                const result = [];
                task.tags.forEach((tag => {
                    if (tags.value.indexOf(tag.id) > -1) {
                        result.push(tag.id);
                    }
                }));
                return result.length === tags.value.length;
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
        tasks = _.orderBy(tasks, sortingBy.value, sortingBy.order);
        return tasks;
    }

    constructor(public http: HttpClient, private store: Store<AppStore>, private userService: UserService,
                public snackBar: MatSnackBar, protected statisticsService: StatisticsService,
                protected configurationService: ConfigurationService, protected projectService: ProjectService,
                protected tagService: TagService) {

        this.tasks$ = this.store.select(s => s.tasks);
        this.tasksFilters$ = this.store.select(s => s.tasksFilters);
        this.currentTasksFilters$ = this.store.select(s => s.currentTasksFilters);
        this.userService.user$.subscribe((user) => {
            if (user) {
                this.loadTasksFilters(user);
                this.loadCurrentTasksFilters(user);
            }
        });
    }

    loadTasks() {
        return this.http.get<Task[]>(`${environment['apiUrl']}/tasks/?assign=all&status=0&status=2`)
            .pipe(
                map(payload => payload.map(task => new Task(task))),
                map(payload => this.store.dispatch(new tasksAction.AddTasks(payload)))
            );
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
            new Filter({'id': 1, label: 'tags', 'value': 'allTags', 'name': 'all tags'})
        ];

        this.store.dispatch(new tasksAction.AddCurrentFilters(filters));
    }

    updateCurrentFilter(currentFilter) {
        debugger;
        this.store.dispatch(new tasksAction.UpdateCurrentFilter(currentFilter));
    }

    getCurrentTagsFilterValue() {
        
        let state: Array<Filter>;
        // we need to use 'synchronous' subscribe. It is only options to get current value
        this.currentTasksFilters$.pipe(take(1)).subscribe(s => state = s);
        return state.filter(filter => filter.label === 'tags')[0].value;
    }

    loadTasksFilters(user: User) {
        const filters = [
            {id: 1, label: 'filter', name: 'not done', value: task => task.status === 0},
            {id: 2, label: 'filter', name: 'w/o due date', value: task => task.finishDate !== undefined},
            {
                id: 3,
                label: 'filter',
                name: 'w/o estimated time',
                value: task => task.estimateTime !== undefined
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
                value: ['priority'],
                order: ['desc'],
                name: 'priority <i class="fa fa-arrow-up"></i>'
            },
            {
                id: 2,
                label: 'sorting',
                value: ['finish_date_obj', 'finishTime'],
                order: ['asc', 'desc'],
                name: 'due date <i class="fa fa-arrow-up"></i>'
            },
            {
                id: 3,
                label: 'sorting',
                value: ['creation_date'],
                order: ['asc'],
                name: 'creation date <i class="fa fa-arrow-up"></i>'
            },
            {id: 4, label: 'sorting', value: ['name'], order: ['asc'], name: 'A-Z <i class="fa fa-arrow-up"></i>'},
            {
                id: 5,
                label: 'sorting',
                value: ['priority'],
                order: ['asc'],
                name: 'priority <i class="fa fa-arrow-down"></i>'
            },
            {
                id: 6,
                label: 'sorting',
                value: ['finish_date_obj', 'finishTime'],
                order: ['desc', 'asc'],
                name: 'due date <i class="fa fa-arrow-down"></i>'
            },
            {
                id: 7,
                label: 'sorting',
                value: ['creation_date'],
                order: ['desc'],
                name: 'creation date  <i class="fa fa-arrow-down"></i>'
            },
            {id: 8, label: 'sorting', value: name, order: ['desc'], name: 'A-Z <i class="fa fa-arrow-down"></i>'},
            {id: 1, label: 'tags', value: 1}
        ].map(filter => new Filter(filter));

        this.store.dispatch(new tasksAction.AddFilters(filters));
    }

    saveTask(task: Task) {
        (task.id) ? this.updateTask(task) : this.createTask(task);
    }

    postponeToToday() {
        this.http.post<Task[]>(`${environment['apiUrl']}/tasks/move_tasks_for_today/`, {}).subscribe((tasks: Task[]) => {
            tasks.map((task) => {
                this.store.dispatch(new tasksAction.UpdateTask(task));
            });
        });
    }

    createTask(task: Task) {
        this.http.post(`${environment['apiUrl']}/tasks/`, task.toApi())
            .pipe(map(payload => new Task(payload)))
            .subscribe(payload => {
                this.snackBar.open('Task has been saved successfully', '', {
                    duration: 2000,
                });
                this.store.dispatch(new tasksAction.CreateTask(payload));
            });
    }

    updateTask(task: Task, isSilenceUpdate = false) {
        const menuStateCopy = task.toApi()['menu_showing'];
        this.configurationService.switchOnProgressBar();
        this.http.put(`${environment['apiUrl']}/tasks/${task.id}/`, task.toApi())
            .subscribe(payload => {
                // this.snackBar.open('Task has been updated successfully', '', {
                //   duration: 2000,
                // });
                payload['menu_showing'] = menuStateCopy;
                this.store.dispatch(new tasksAction.UpdateTask(new Task(payload)));
                if (!isSilenceUpdate) {
                    this.statisticsService.loadAllStatistics(undefined);
                }
                this.configurationService.switchOffProgressBar();
                this.projectService.loadProjects().subscribe();
                this.tagService.loadTags().subscribe();
            });
    }

    deleteTask(task: Task) {
        this.http.delete(`${environment['apiUrl']}/tasks/${task.id}/`)
            .subscribe(action => {
                this.store.dispatch(new tasksAction.DeleteTask(task));
                this.snackBar.open('Task has been deleted successfully', '', {
                    duration: 2000,
                });
            });
    }

}
