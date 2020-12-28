import {createAction, props} from '@ngrx/store';
import {Task} from '@data/tasks/models/tasks';
import {Update} from '@ngrx/entity';


export const queryTasks = createAction(
    '[TASKS] QUERY TASKS'
)

export const requestsAllTasks = createAction(
    '[TASKS] REQUEST_ALL_TASKS'
)

export const requestCreateTask = createAction(
    '[TASKS] REQUEST_CREATE_TASK',
    props<{ task: Task }>()
)

export const addTasks = createAction(
    '[TASKS] ADD_TASKS',
    props<{ tasks: Task[] }>()
)

export const createTask = createAction(
    '[TASKS] CREATE_TASK',
    props<{ task: Task, progressBar?: true, snackBar?: true }>()
)


export const updateTask = createAction(
    '[TASKS] UPDATE_TASK',
    props<{ task: Update<Task>, progressBar?: true, snackBar?: true }>()
)

export const requestUpdateTask = createAction(
    '[TASKS] REQUEST_UPDATE TASK',
    props<{ task: Update<Task>, progressBar?: true, snackBar?: true }>()
)

export const setStatusDone = createAction(
    '[TASKS] SET_STATUS_DONE',
    props<{ task: Update<Task>, progressBar?: true, snackBar?: true }>()
)

export const deleteTask = createAction(
    '[TASKS] DELETE_TASK',
    props<{ taskId: string }>()
)

export const requestDeleteTask = createAction(
    '[TASKS] REQUEST_DELETE TASK',
    props<{ taskId: string }>()
)

export const closeMenuInAllTasks = createAction(
    '[TASKS] CLOSE MENU IN ALL TASKS',
    props<{ tasks: Update<Task>[] }>()
)

export const repairAvatarUrl = createAction(
    '[TASKS] REPAIR AVATAR URL',
    props<{task: Task}>()
)
