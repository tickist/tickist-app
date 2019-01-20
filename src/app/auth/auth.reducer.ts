import {AuthActions, AuthActionTypes, FetchedLoginUser, Login} from './auth.actions';
import {Token} from './models';


export interface AuthState {
    loggedIn: boolean;
    token: Token;
}

export const initialState: AuthState = {
    loggedIn: false,
    token: undefined
};

export function authReducer(state = initialState, action: AuthActions): AuthState {
    switch (action.type) {
        case AuthActionTypes.LoginAction:
            return {
                loggedIn: true,
                token: ( <Login> action).payload.token
            };
        case AuthActionTypes.FetchedLoginUser:
            return {
                loggedIn: true,
                ...state
            };

        case AuthActionTypes.LogoutAction:
            return {
                loggedIn: false,
                token: undefined
            };

        default:
            return state;
    }
}
