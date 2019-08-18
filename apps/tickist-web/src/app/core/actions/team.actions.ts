import {Action} from '@ngrx/store';
import {SimpleUser} from '../../../../../../libs/data/src/users/models';
import {Update} from '@ngrx/entity';

export enum TeamActionTypes {
    LoadTeams = '[Team] Load Teams',
    AddTeamMemers = '[Team] ADD_TEAM_MEMBERS',
    UpdateTeamMember = '[Team] UPDATE_TEAM_MEMBER',
    DeleteTeamMember = '[Team] DELETE_TEAM_MEMBER',


}

export class LoadTeams implements Action {
    readonly type = TeamActionTypes.LoadTeams;
}

export class AddTeamMemers implements Action {
    readonly type = TeamActionTypes.AddTeamMemers;

    constructor(public payload: { users: SimpleUser[] }) {
    }
}

export class UpdateTeamMember implements Action {
    readonly type = TeamActionTypes.UpdateTeamMember;

    constructor(public payload: { user: Update<SimpleUser> }) {}
}

export class DeleteTeamMember implements Action {
    readonly type = TeamActionTypes.DeleteTeamMember;

    constructor(public payload: { userId: number }) {}
}


export type TeamActions = LoadTeams | AddTeamMemers | UpdateTeamMember | DeleteTeamMember;
