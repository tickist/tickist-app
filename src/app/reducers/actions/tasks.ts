import {Task} from '../../models/tasks';
import {Filter} from '../../models/filter';
import {Action} from '@ngrx/store';

export const ADD_TASKS = 'ADD_TASKS';
export const CREATE_TASK = 'CREATE_TASK';
export const UPDATE_TASK = 'UPDATE_TASK';
export const DELETE_TASK = 'DELETE_TASK';

export const ADD_CURRENT_FILTERS = 'ADD_CURRENT_FILTERS';
export const UPDATE_CURRENT_FILTER = 'UPDATE_CURRENT_FILTER';

export const ADD_CURRENT_FUTURE_TASKS_FILTERS = 'ADD_CURRENT_FUTURE_TASKS_FILTERS';
export const UPDATE_CURRENT_FUTURE_TASKS_FILTER = 'UPDATE_CURRENT_FUTURE_TASKS_FILTER';

export const ADD_FILTERS = '[TASKS] ADD_FILTERS';
export const DELETE_NON_FIXED_ASSIGNED_TO = '[TASKS] DELETE_NON_FIXED_ASSIGNED_TO';
export const ADD_NEW_ASSIGNED_TO = '[TASKS] ADD_NEW_ASSIGNED_TO';
export const UPDATE_FILTERS = '[TASKS] UPDATE_FILTERS';

export const ADD_FUTURE_TASKS_FILTERS = '[TASKS] ADD_FUTURE_TASKS_FILTERS';
export const UPDATE_FUTURE_TASKS_FILTERS = '[TASKS] UPDATE_FUTURE_TASKS_FILTERS';


export class AddTasks implements Action {
    readonly type = ADD_TASKS;

    constructor(public payload: Task[]) {
    }
}

export class CreateTask implements Action {
    readonly type = CREATE_TASK;

    constructor(public payload: Task) {
    }
}

export class UpdateTask implements Action {
    readonly type = UPDATE_TASK;

    constructor(public payload: Task) {
    }
}

export class DeleteTask implements Action {
    readonly type = DELETE_TASK;

    constructor(public payload: Task) {
    }
}

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

export class AddNewAssignedTo implements Action {
    readonly type = ADD_NEW_ASSIGNED_TO;

    constructor(public payload: Filter) {
    }
}

export class DeleteNonFixedAssignedTo implements Action {
    readonly type = DELETE_NON_FIXED_ASSIGNED_TO;

    constructor(public payload: Filter | {}) {
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


export type Actions = AddFilters | AddNewAssignedTo | DeleteNonFixedAssignedTo | UpdateFilters | AddTasks | CreateTask
    | UpdateTask | DeleteTask | AddCurrentFilters | UpdateCurrentFilter | AddFutureTasksFilters | UpdateFutureTasksFilters
    | UpdateCurrentFutureTasksFilters | AddCurrentFutureTasksFilters;


