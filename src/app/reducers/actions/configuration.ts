import {Action} from '@ngrx/store';
import {IActiveDateElement} from '../../models/active-data-element.interface';
export const UPDATE_ACTIVE_DATA_ELEMENT = 'UPDATE_ACTIVE_DATA_ELEMENT';
export const UPDATE_DETECT_API_ERROR = 'UPDATE_DETECT_API_ERROR';
export const SWITCH_OFF_PROGRESS_BAR = 'SWITCH_OFF_PROGRESS_BAR';
export const SWITCH_ON_PROGRESS_BAR = 'SWITCH_ON_PROGRESS_BAR';
export const UPDATE_LEFT_SIDENAV_VISIBILITY = 'UPDATE_LEFT_SIDENAV_VISIBILITY';
export const UPDATE_RIGHT_SIDENAV_VISIBILITY = 'UPDATE_RIGHT_SIDENAV_VISIBILITY';
export const UPDATE_OFFLINE_MODE_NOTIFICATION = 'UPDATE_OFFLINE_MODE_NOTIFICATION';
export const UPDATE_ADD_TASK_VISIBILITY = 'UPDATE_ADD_TASK_VISIBILITY';


export class UpdateActiveDateElement implements Action {
    readonly type = UPDATE_ACTIVE_DATA_ELEMENT;

    constructor(public payload: IActiveDateElement) {
    }
}

export class UpdateDetectApiError implements Action {
    readonly type = UPDATE_DETECT_API_ERROR;

    constructor(public payload: any) {
    }
}

export class UpdateOfflineModeNotification implements Action {
    readonly type = UPDATE_OFFLINE_MODE_NOTIFICATION;

    constructor(public payload: any) {
    }
}



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


export type Actions = UpdateDetectApiError
    | UpdateRightSidenavVisibility
    | UpdateLeftSidenavVisibility
    | UpdateActiveDateElement
    | UpdateOfflineModeNotification
    | UpdateAddTaskComponentVisibility;
