import {createAction, props} from '@ngrx/store';

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
