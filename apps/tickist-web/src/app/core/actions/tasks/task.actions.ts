import {Action} from '@ngrx/store';
import {Task} from '@data/tasks/models/tasks';
import {Update} from '@ngrx/entity';


export enum TaskActionTypes {
    QUERY_TASKS = '[TASKS] QUERY TASKS',
    REQUEST_ALL_TASKS = '[TASKS] REQUEST_ALL_TASKS',
    REQUEST_CREATE_TASK = '[TASKS] REQUEST_CREATE_TASK',
    REQUEST_UPDATE_TASK = '[TASKS] REQUEST_UPDATE TASK',
    REQUEST_REQUEST_TASK = '[TASKS] REQUEST_DELETE TASK',
    SET_STATUS_DONE = '[TASKS] SET_STATUS_DONE',
    REQUEST_DELETE_TASK = '[TASKS] REQUEST_DELETE_TASK',
    ADD_TASKS = '[TASKS] ADD_TASKS',
    CREATE_TASK = '[TASKS] CREATE_TASK',
    UPDATE_TASK = '[TASKS] UPDATE_TASK',
    DELETE_TASK = '[TASKS] DELETE_TASK',
    CLOSE_MENU_IN_ALL_TASKS = '[TASKS] CLOSE MENU IN ALL TASKS'
}

export class QueryTasks implements Action {
    readonly type = TaskActionTypes.QUERY_TASKS;
}

export class RequestsAllTasks implements Action {
    readonly type = TaskActionTypes.REQUEST_ALL_TASKS;
}

export class RequestCreateTask implements Action {
    readonly type = TaskActionTypes.REQUEST_CREATE_TASK;

    constructor(public payload: { task: Task }) {
    }
}

export class AddTasks implements Action {
    readonly type = TaskActionTypes.ADD_TASKS;

    constructor(public payload: { tasks: Task[] }) {
    }
}

export class CreateTask implements Action {
    readonly type = TaskActionTypes.CREATE_TASK;

    constructor(public payload: { task: Task, progressBar?: true, snackBar?: true}) {
    }
}


export class UpdateTask implements Action {
    readonly type = TaskActionTypes.UPDATE_TASK;

    constructor(public payload: { task: Update<Task>, progressBar?: true, snackBar?: true }) {
    }
}

export class RequestUpdateTask implements Action {
    readonly type = TaskActionTypes.REQUEST_UPDATE_TASK;

    constructor(public payload: { task: Update<Task>, progressBar?: true, snackBar?: true }) {
    }
}

export class SetStatusDone implements Action {
    readonly type = TaskActionTypes.SET_STATUS_DONE;

    constructor(public payload: { task: Update<Task>, progressBar?: true, snackBar?: true }) {
    }
}

export class DeleteTask implements Action {
    readonly type = TaskActionTypes.DELETE_TASK;

    constructor(public payload: { taskId: string }) {
    }
}

export class RequestDeleteTask implements Action {
    readonly type = TaskActionTypes.REQUEST_REQUEST_TASK;

    constructor(public payload: { taskId: string }) {
    }
}

export class CloseMenuInAllTasks implements Action {
    readonly type = TaskActionTypes.CLOSE_MENU_IN_ALL_TASKS;

    constructor(public payload: {tasks: Update<Task>[]}) {
    }
}



export type TaskActions = AddTasks
    | DeleteTask
    | UpdateTask
    | CreateTask
    | RequestsAllTasks
    | RequestCreateTask
    | SetStatusDone
    | QueryTasks
    | CloseMenuInAllTasks;
