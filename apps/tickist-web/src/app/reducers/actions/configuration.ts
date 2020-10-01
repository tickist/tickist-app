import {createAction, props} from '@ngrx/store';


export const updateLeftSidenavVisibility= createAction(
    '[Configuration] UPDATE_LEFT_SIDENAV_VISIBILITY',
    props<Partial<{ 'position': string,
        'mode': string,
        'open': boolean}>>()
)

export const updateAddTaskComponentVisibility= createAction(
    '[Configuration] UPDATE_ADD_TASK_VISIBILITY',
    props<{visible: boolean}>()
)

