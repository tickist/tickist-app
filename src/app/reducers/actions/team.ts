import {Action} from '@ngrx/store';
import {SimpleUser} from '../../user/models';
import {ISimpleUserApi} from '../../models/simple-user-api.interface';
export const ADD_TEAM_MEMBERS = 'ADD_TEAM_MEMBERS';
export const UPDATE_TEAM_MEMBER = 'UPDATE_TEAM_MEMBER';
export const DELETE_TEAM_MEMBER = 'DELETE_TEAM_MEMBER';

export class AddTeamMembers implements Action {
  readonly type = ADD_TEAM_MEMBERS;

  constructor(public payload: SimpleUser[]) {
  }
}

export class UpdateTeamMember implements Action {
  readonly type = UPDATE_TEAM_MEMBER;

  constructor(public payload: ISimpleUserApi) {
  }
}

export class DeleteTeamMember implements Action {
  readonly type = DELETE_TEAM_MEMBER;

  constructor(public payload: SimpleUser) {
  }
}

export type Actions = AddTeamMembers | UpdateTeamMember | DeleteTeamMember;
