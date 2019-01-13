import {Action} from '@ngrx/store';
import {User} from '../../user/models';
export const ADD_USER = 'ADD_USER';
export const UPDATE_USER = 'UPDATE_USER';


export class AddUser implements Action {
  readonly type = ADD_USER;

  constructor(public payload: User) {
  }
}

export class UpdateUser implements Action {
  readonly type = UPDATE_USER;

  constructor(public payload: User) {
  }
}

export type Actions = AddUser | UpdateUser;
