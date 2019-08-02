import {Action} from '@ngrx/store';
import {User} from '../models';
import {Task} from '../../models/tasks/tasks';

export enum UserActionTypes {
    AddUser = '[User] Add Users',
    UpdateUser = '[User Form Edit] Update Users'
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


export type UserActions = AddUser | UpdateUser;
