import {Action} from '@ngrx/store';
import {User} from '../../../../../../libs/data/src/lib/users/models';
import {Task} from '../../../../../../libs/data/src/lib/tasks/models/tasks';

export enum UserActionTypes {
    AddUser = '[User] Add Users',
    UpdateUser = '[User Form Edit] Update Users',
    RequestUpdateUser = '[User Form Edit] Request Update Users',
    QueryUser = '[User] QueryUser'
}

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


export type UserActions = AddUser | UpdateUser | RequestUpdateUser;
