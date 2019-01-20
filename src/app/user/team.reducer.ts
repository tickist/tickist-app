import {SimpleUser} from './models';
import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {TeamActions, TeamActionTypes} from './team.actions';
import {TickistActions, TickistActionTypes} from '../tickist.actions';


export interface TeamState  extends EntityState<SimpleUser> {}

export const adapter: EntityAdapter<SimpleUser> =
    createEntityAdapter<SimpleUser>();

export const initialTeamState: TeamState = adapter.getInitialState();

export function reducer(state = initialTeamState, action: (TeamActions | TickistActions)): TeamState {
    switch (action.type) {

        case TeamActionTypes.AddTeamMemers:
            return adapter.addAll(action.payload.users, state);

        case TeamActionTypes.DeleteTeamMember:
            return adapter.removeOne(action.payload.userId, state);

        case TeamActionTypes.UpdateTeamMember:
            return adapter.updateOne(action.payload.user, state);
        case TickistActionTypes.ResetStore:
            return initialTeamState;
        default:
            return state;
    }
}


export const {
    selectAll,
    selectEntities,
    selectIds,
    selectTotal

} = adapter.getSelectors();

