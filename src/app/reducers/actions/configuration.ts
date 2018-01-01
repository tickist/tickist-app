import {Action} from '@ngrx/store';
export const UPDATE_ACTIVE_DAY = 'UPDATE_ACTIVE_DAY';
export const UPDATE_DETECT_API_ERROR = 'UPDATE_DETECT_API_ERROR';
export const SWITCH_OFF_PROGRESS_BAR = 'SWITCH_OFF_PROGRESS_BAR';
export const SWITCH_ON_PROGRESS_BAR = 'SWITCH_ON_PROGRESS_BAR';
export const UPDATE_LEFT_SIDENAV_VISIBILITY = 'UPDATE_LEFT_SIDENAV_VISIBILITY';
export const UPDATE_RIGHT_SIDENAV_VISIBILITY = 'UPDATE_RIGHT_SIDENAV_VISIBILITY';
export const UPDATE_OFFLINE_MODE_NOTIFICATION = 'UPDATE_OFFLINE_MODE_NOTIFICATION';


export class UpdateActiveDay implements Action {
  readonly type = UPDATE_ACTIVE_DAY;

  constructor(public payload: any) {
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

export class SwitchOffProgressBar implements Action {
  readonly type = SWITCH_OFF_PROGRESS_BAR;

  constructor(public payload: any) {
  }
}

export class SwitchOnProgressBar implements Action {
  readonly type = SWITCH_ON_PROGRESS_BAR;

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


export type Actions =
  UpdateDetectApiError
  | UpdateRightSidenavVisibility
  | UpdateLeftSidenavVisibility
  | SwitchOffProgressBar
  | SwitchOnProgressBar
  | UpdateActiveDay
  | UpdateOfflineModeNotification;
