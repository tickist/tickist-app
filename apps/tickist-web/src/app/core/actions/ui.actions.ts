import {createAction} from '@ngrx/store';


export const focusOnSearchInput = createAction(
    '[Core UI] Focus on search input'
)
export const blurOnSearchInput = createAction(
    '[Core UI] Blur on search input'
)

export const focusOnAddTaskInput = createAction(
    '[Core UI] Focus on add task input'
)
export const blurOnAddTaskInput = createAction(
    '[Core UI] Blur on add task input'
)
