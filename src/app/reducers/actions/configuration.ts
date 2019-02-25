import {Action} from '@ngrx/store';
export const UPDATE_LEFT_SIDENAV_VISIBILITY = 'UPDATE_LEFT_SIDENAV_VISIBILITY';
export const UPDATE_RIGHT_SIDENAV_VISIBILITY = 'UPDATE_RIGHT_SIDENAV_VISIBILITY';
export const UPDATE_ADD_TASK_VISIBILITY = 'UPDATE_ADD_TASK_VISIBILITY';



export class UpdateLeftSidenavVisibility implements Action {
    readonly type = UPDATE_LEFT_SIDENAV_VISIBILITY;

    constructor(public payload: any) {
    }
}

export class UpdateRightSidenavVisibility implements Action {
    readonly type = UPDATE_RIGHT_SIDENAV_VISIBILITY;

    constructor(public payload: any) {
    }
}

export class UpdateAddTaskComponentVisibility implements Action {
    readonly type = UPDATE_ADD_TASK_VISIBILITY;

    constructor(public payload: any) {
    }
}


export type Actions = UpdateRightSidenavVisibility
    | UpdateLeftSidenavVisibility
    | UpdateAddTaskComponentVisibility;
