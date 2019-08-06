import {Observable} from 'rxjs';
import {Injectable} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppStore} from '../../store';
import {User} from '../models';
import * as _ from 'lodash';
import {ConfigurationService} from '../../services/configuration.service';
import * as tasksAction from '../../reducers/actions/tasks';
import {Filter} from '../../models/filter';
import {HttpClient} from '@angular/common/http';
import {take} from 'rxjs/operators';
import {Task} from '../../models/tasks/tasks';
import {Tag} from '../../models/tags';
import {AddUser} from '../actions/user.actions';
import {SortBy} from '../../tasks/models/sortBy';


@Injectable()
export class TasksFiltersService {
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

    constructor(public http: HttpClient, private store: Store<AppStore>) {
    }

    static getDefaultEstimateTimeFilters() {
        const filters_lt = [
            new Filter({id: 1, value: `task => task.estimateTime >= 0`, label: 'estimateTime__lt', name: '0'}),
            new Filter({id: 2, value: `task => task.estimateTime >= 15`, label: 'estimateTime__lt', name: '15m'}),
            new Filter({id: 3, value: `task => task.estimateTime >= 30`, label: 'estimateTime__lt', name: '30m'}),
            new Filter({id: 4, value: `task => task.estimateTime >= 60`, label: 'estimateTime__lt', name: '1h'}),
            new Filter({id: 5, value: `task => task.estimateTime >= 120`, label: 'estimateTime__lt', name: '2h'}),
            new Filter({id: 6, value: `task => task.estimateTime >= 240`, label: 'estimateTime__lt', name: '41h'}),
            new Filter({id: 7, value: `task => task.estimateTime >= 480`, label: 'estimateTime__lt', name: '8h'}),
            new Filter({id: 8, value: `task => task.estimateTime >= 4294967296`, label: 'estimateTime__lt', name: 'inf'})
        ];
        const filters_gt = [
            new Filter({id: 1, value: `task => task.estimateTime <= 0`, label: 'estimateTime__gt', name: '0'}),
            new Filter({id: 2, value: `task => task.estimateTime <= 15`, label: 'estimateTime__gt', name: '15m'}),
            new Filter({id: 3, value: `task => task.estimateTime <= 30`, label: 'estimateTime__gt', name: '30m'}),
            new Filter({id: 4, value: `task => task.estimateTime <= 60`, label: 'estimateTime__gt', name: '1h'}),
            new Filter({id: 5, value: `task => task.estimateTime <= 120`, label: 'estimateTime__gt', name: '2h'}),
            new Filter({id: 6, value: `task => task.estimateTime <= 240`, label: 'estimateTime__gt', name: '4h'}),
            new Filter({id: 7, value: `task => task.estimateTime <= 480`, label: 'estimateTime__gt', name: '8h'}),
            new Filter({id: 8, value: `task => task.estimateTime <= 4294967296`, label: 'estimateTime__gt', name: 'inf'})
        ];
        return {
            filters_lt,
            filters_gt
        };
    }

    static getDefaultAssignedToFilters(user: User) {
        return [
            TasksFiltersService.getAssignedToMeFilter(user),
            TasksFiltersService.getAssignedToAllFilter()
        ];
    }

    static getDefaultCurrentAssignedToFilter(user: User) {
        return TasksFiltersService.getAssignedToMeFilter(user);
    }

    static getAssignedToMeFilter(user: User) {
        return new Filter({
            id: user.id,
            label: 'assignedTo',
            value: `task => task.owner.id === '${user.id}'`,
            name: 'me',
            avatar: user.avatarUrl,
            fixed: true
        });
    }

    static getAssignedToAllFilter() {
        return new Filter({
            id: 0,
            label: 'assignedTo',
            value: `task => true`,
            name: 'all',
            avatar: '/assets/default_avatar.png',
            fixed: true
        });
    }

    static getDefaultCurrentEstimateTimeFilters() {
        return {
            currentFilter_lt: new Filter({
                'id': 1,
                'value': `task => task.estimateTime >= 0`,
                label: 'estimateTime__lt',
                'name': '0'
            }),
            currentFilter_gt: new Filter({
                id: 8,
                value: `task => task.estimateTime <= 4294967296`,
                label: 'estimateTime__gt',
                name: 'inf'
            }),
        };
    }

    static getDefaultCurrentTagsFilters(): Filter {
        return new Filter({
            'id': 1,
            label: 'tags',
            'value': 'allTasks',
            'name': 'all tasks'
        });
    }

    static getAllSortByOptions(): SortBy[] {
        return [
            new SortBy({
                id: 1,
                label: 'sorting',
                sortKeys: ['priority'],
                order: ['desc'],
                name: 'priority',
                icon: 'arrow-up'
            }),
            new SortBy({
                id: 2,
                label: 'sorting',
                sortKeys: ['finish_date_obj', 'finishTime'],
                order: ['asc', 'desc'],
                name: 'due date',
                icon: 'arrow-up'
            }),
            new SortBy({
                id: 3,
                label: 'sorting',
                sortKeys: ['creation_date'],
                order: ['asc'],
                name: 'creation date',
                icon: 'arrow-up'
            }),
            new SortBy({
                id: 4,
                label: 'sorting',
                sortKeys: ['name'],
                order: ['asc'],
                name: 'A-Z',
                icon: 'arrow-up'
            }),
            new SortBy({
                id: 5,
                label: 'sorting',
                sortKeys: ['priority'],
                order: ['asc'],
                name: 'priority',
                icon: 'arrow-down'
            }),
            new SortBy({
                id: 6,
                label: 'sorting',
                sortKeys: ['finish_date_obj', 'finishTime'],
                order: ['desc', 'asc'],
                name: 'due date',
                icon: 'arrow-down'
            }),
            new SortBy({
                id: 7,
                label: 'sorting',
                sortKeys: ['creation_date'],
                order: ['desc'],
                name: 'creation date',
                icon: 'arrow-down'
            }),
            new SortBy({
                id: 8,
                label: 'sorting',
                sortKeys: ['name'],
                order: ['desc'],
                name: 'A-Z',
                icon: 'arrow-down'
            })
        ];
    }

    static getDefaultSortByTask(): SortBy {
        return TasksFiltersService.getAllSortByOptions()[4];
    }

    static getDefaultCurrentMainFilter() {
        return TasksFiltersService.getDefaultMainFilters()[0];
    }

    static getDefaultMainFilters() {
        return [
            new Filter({id: 1, label: 'filter', name: 'not done', value: `task => task.isDone === false`}),
            new Filter({id: 2, label: 'filter', name: 'w/o due date', value: `task => task.finishDate !== ''`}),
            new Filter({id: 3, label: 'filter', name: 'w/o estimated time', value: `task => task.estimateTime === null`}),
            new Filter({id: 4, label: 'filter', name: 'on hold', value: `task => task.onHold === true`})
        ];
    }


    updateCurrentFilter(currentFilter) {
        this.store.dispatch(new tasksAction.UpdateCurrentFilter(currentFilter));
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

}
