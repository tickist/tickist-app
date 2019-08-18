import {User} from '../models';
import {UserActions, UserActionTypes} from '../actions/user.actions';
import {TickistActions, TickistActionTypes} from '../../tickist.actions';


export interface UserState {
    user: User;
}

export const initialState: UserState = {
    user: undefined
};

export function reducer(state = initialState, action: UserActions | TickistActions): UserState {
    switch (action.type) {
        case UserActionTypes.AddUser:
            return {
                user: (<UserActions> action).payload.user
            };
        case UserActionTypes.UpdateUser:
            return {
                user: (<UserActions> action).payload.user
            };
        case TickistActionTypes.ResetStore:
            return initialState;
        default:
            return state;
    }
}
