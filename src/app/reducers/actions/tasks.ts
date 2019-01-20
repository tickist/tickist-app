import {Task} from '../../models/tasks';
import {Filter} from '../../models/filter';
import {Action} from '@ngrx/store';


export const CLOSE_MENU_IN_TASKS = 'CLOSE_MENU_IN_TASKS';

export const ADD_CURRENT_FILTERS = 'ADD_CURRENT_FILTERS';
export const UPDATE_CURRENT_FILTER = 'UPDATE_CURRENT_FILTER';

export const ADD_CURRENT_FUTURE_TASKS_FILTERS = 'ADD_CURRENT_FUTURE_TASKS_FILTERS';
export const UPDATE_CURRENT_FUTURE_TASKS_FILTER = 'UPDATE_CURRENT_FUTURE_TASKS_FILTER';

export const ADD_FILTERS = '[TASKS] ADD_FILTERS';

export const UPDATE_FILTERS = '[TASKS] UPDATE_FILTERS';

export const ADD_FUTURE_TASKS_FILTERS = '[TASKS] ADD_FUTURE_TASKS_FILTERS';
export const UPDATE_FUTURE_TASKS_FILTERS = '[TASKS] UPDATE_FUTURE_TASKS_FILTERS';



export class AddCurrentFilters implements Action {
    readonly type = ADD_CURRENT_FILTERS;

    constructor(public payload: Filter[]) {
    }
}

export class UpdateCurrentFilter implements Action {
    readonly type = UPDATE_CURRENT_FILTER;

    constructor(public payload: Filter) {
    }
}

export class AddFilters implements Action {
    readonly type = ADD_FILTERS;

    constructor(public payload: Filter[]) {
    }
}



export class UpdateFilters implements Action {
    readonly type = UPDATE_FILTERS;

    constructor(public payload: Filter) {
    }
}

export class UpdateFutureTasksFilters implements Action {
    readonly type = UPDATE_FUTURE_TASKS_FILTERS;

    constructor(public payload: Filter) {
    }
}

export class AddFutureTasksFilters implements Action {
    readonly type = ADD_FUTURE_TASKS_FILTERS;

    constructor(public payload: Filter[]) {
    }
}

export class UpdateCurrentFutureTasksFilters implements Action {
    readonly type = UPDATE_CURRENT_FUTURE_TASKS_FILTER;

    constructor(public payload: Filter) {
    }
}

export class AddCurrentFutureTasksFilters implements Action {
    readonly type = ADD_CURRENT_FUTURE_TASKS_FILTERS;

    constructor(public payload: Filter) {
    }
}


export type Actions =
    AddFilters
    | UpdateFilters
    | AddCurrentFilters
    | UpdateCurrentFilter
    | AddFutureTasksFilters
    | UpdateFutureTasksFilters
    | UpdateCurrentFutureTasksFilters
    | AddCurrentFutureTasksFilters;


