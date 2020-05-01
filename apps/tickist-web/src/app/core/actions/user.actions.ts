import {Action, createAction, props} from '@ngrx/store';
import {User} from '@data/users/models';


export enum UserActionTypes {
    AddUser = '[User] Add Users',
    UpdateUser = '[User Form Edit] Update Users',
    RequestUpdateUser = '[User Form Edit] Request Update Users',
    QueryUser = '[User] QueryUser'
}

export const changeAvatar = createAction('[User] Change avatar',
    props<{ avatarUrl: string }>()
);

export class AddUser implements Action {
    readonly type = UserActionTypes.AddUser;

    constructor(public payload: { user: User, progressBar?: boolean, snackBar?: boolean }) {
    }
}

export class UpdateUser implements Action {
    readonly type = UserActionTypes.UpdateUser;

    constructor(public payload: { user: User, progressBar?: boolean, snackBar?: boolean}) {
    }
}

export class RequestUpdateUser implements Action {
    readonly type = UserActionTypes.RequestUpdateUser;

    constructor(public payload: { user: User, progressBar?: boolean, snackBar?: boolean}) {
    }
}

export class QueryUser implements Action {
    readonly type = UserActionTypes.QueryUser;

}

export const savefcmToken = createAction('[USER] save scfToken', props<{token: string}>());

export const removeNotificationPermission = createAction('[USER] Remove notifications permissions');

export type UserActions = AddUser | UpdateUser | RequestUpdateUser;
