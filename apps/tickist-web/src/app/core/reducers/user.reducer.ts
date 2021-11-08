import {User} from '@data/users/models';
import {addUser, updateUser} from '../actions/user.actions';
import {Action, createReducer, on} from "@ngrx/store";
import {resetStore} from "../../tickist.actions";


export interface UserState {
    user: User;
}

export const initialState: UserState = {
    user: undefined
};

const userReducer = createReducer(
    initialState,
    on(addUser, (state, props) => ({
            user: props.user
        })),
    on(updateUser, (state, props) => ({
            user: props.user
        })),
    on(resetStore, () => initialState)
)

export function reducer(state: UserState, action: Action) {
    return userReducer(state, action);
}
