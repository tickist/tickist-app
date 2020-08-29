import {Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppStore} from '../../store';
import {User} from '@data/users/models';
import * as _ from 'lodash';
import * as tasksAction from '../../reducers/actions/tasks';
import {Task} from '@data/tasks/models/tasks';
import {Tag} from '@data/tags/models/tags';
import {SortBy} from '@data/tasks/models/sortBy';
import {Filter} from '@data/filter';


@Injectable({
    providedIn: 'root',
})
export class TasksFiltersService {
    user: User;
    assignedToAll: Filter;
    assignedToMe: Filter;


    constructor(private store: Store) {
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
            new Filter({id: 1, label: 'filter', name: 'not done', value: `task => task.isDone === false && task.onHold === false`}),
            new Filter({id: 2, label: 'filter', name: 'w/o due date', value: `task => task.finishDate !== ''`}),
            new Filter({id: 3, label: 'filter', name: 'w/o estimated time', value: `task => task.estimateTime === null`}),
            new Filter({id: 4, label: 'filter', name: 'on hold', value: `task => task.onHold === true`})
        ];
    }


    updateCurrentFilter(currentFilter) {
        this.store.dispatch(new tasksAction.UpdateCurrentFilter(currentFilter));
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
