import {createAction, props} from '@ngrx/store';
import {User} from '@data/users/models';


export const addUser = createAction(
    '[User] Add Users',
    props<{ user: User, progressBar?: boolean, snackBar?: boolean }>()
)

export const updateUser = createAction(
    '[User Form Edit] Update Users',
    props<{ user: User, progressBar?: boolean, snackBar?: boolean}>()
)

export const requestUpdateUser = createAction(
    '[User Form Edit] Request Update Users',
    props<{ user: User, progressBar?: boolean, snackBar?: boolean}>()
)

export const queryUser = createAction(
    '[User] QueryUser'
)
export const changeAvatar = createAction('[User] Change avatar',
    props<{ avatarUrl: string }>()
);

export const savefcmToken = createAction('[USER] save scfToken', props<{token: string}>());

export const removeNotificationPermission = createAction('[USER] Remove notifications permissions');

