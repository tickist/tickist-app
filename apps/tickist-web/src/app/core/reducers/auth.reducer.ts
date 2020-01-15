import {AuthActions, AuthActionTypes, Login} from '../actions/auth.actions';


export interface AuthState {
    loggedIn: boolean;
    uid: string;
}

export const initialState: AuthState = {
    loggedIn: false,
    uid: undefined
};

export function authReducer(state = initialState, action: AuthActions): AuthState {
    switch (action.type) {
        case AuthActionTypes.LoginAction:
            return {
                loggedIn: true,
                uid: ( <Login> action).payload.uid
            };
        case AuthActionTypes.FetchedLoginUser:
            return {
                loggedIn: true,
                ...state
            };

        case AuthActionTypes.LogoutAction:
            return {
                loggedIn: false,
                uid: undefined
            };

        default:
            return state;
    }
}
