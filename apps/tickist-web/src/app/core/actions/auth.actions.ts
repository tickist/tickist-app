import {Action, createAction, props} from '@ngrx/store';

export enum AuthActionTypes {
    LoginAction = '[Auth] login user',
    FetchedLoginUser= '[Auth] Fetched Login User From Server',
    LogoutAction = '[Auth] Logout user'
}
export const login = createAction(
    '[Auth] login user',
    props<{uid: string}>()
)

export const fetchedLoginUser = createAction(
    '[Auth] Fetched Login User From Server',
    props<{uid: string}>()
)

export const logout = createAction(
    '[Auth] Logout user'
)



export class Login implements Action {

    readonly type = AuthActionTypes.LoginAction;

    constructor(public payload: { uid: string }) {

    }
}

export class FetchedLoginUser implements Action {
    readonly type = AuthActionTypes.FetchedLoginUser;

    constructor(public payload: { uid: string }) {

    }
}

export class Logout implements Action {
    readonly type = AuthActionTypes.LogoutAction;

}


export type AuthActions = Login | Logout | FetchedLoginUser;
