import {Action} from '@ngrx/store';
import {Token} from '../../auth/models';

export enum AuthActionTypes {
    LoginAction = '[Auth] login user',
    FetchedLoginUser= '[Auth] Fetched Login User From Server',
    LogoutAction = '[Auth] Logout user'
}

export class Login implements Action {

    readonly type = AuthActionTypes.LoginAction;

    constructor(public payload: { token: Token }) {

    }
}

export class FetchedLoginUser implements Action {
    readonly type = AuthActionTypes.FetchedLoginUser;

    constructor(public payload: { token: Token }) {

    }
}

export class Logout implements Action {
    readonly type = AuthActionTypes.LogoutAction;

}


export type AuthActions = Login | Logout | FetchedLoginUser;
