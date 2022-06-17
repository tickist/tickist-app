import {fetchedLoginUser, login, logout} from '../actions/auth.actions';
import {Action, createReducer, on} from "@ngrx/store";


export interface AuthState {
    loggedIn: boolean;
    uid: string;
}

export const initialState: AuthState = {
    loggedIn: false,
    uid: undefined
};

const authReducer = createReducer(
    initialState,
    on(login, (state, props) => ({
            loggedIn: true,
            uid: props.uid
        })),
    on(fetchedLoginUser, (state, props) => ({
            loggedIn: true,
            ...state
        })),
    on(logout, () => ({
            loggedIn: false,
            uid: undefined
        })),
)

export function reducer(state: AuthState, action: Action) {
    return authReducer(state, action);
}
