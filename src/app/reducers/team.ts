import {SimpleUser} from '../models/user';
import * as teamActions from './actions/team';

export function team (state = [], action: teamActions.Actions) {

  switch (action.type) {
    case teamActions.ADD_TEAM_MEMBERS:
      return (<teamActions.AddTeamMembers>action).payload;
    case teamActions.UPDATE_TEAM_MEMBER:
      return [...state, new SimpleUser(action.payload)];
    case teamActions.DELETE_TEAM_MEMBER:
      return state.map(user => {
        return user.id === (<teamActions.DeleteTeamMember>action).payload.id ? Object.assign({}, user, action.payload) : user;
      });
    default:
      return state;
  }
}
