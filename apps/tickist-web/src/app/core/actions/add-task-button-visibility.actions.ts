import {createAction} from '@ngrx/store';

export const showAddTaskButton = createAction(
    '[AddTaskButtonVisibility] Show add tasks button'
)

export const hideAddTaskButton = createAction(
    '[AddTaskButtonVisibility] Hide add tasks button'
)

