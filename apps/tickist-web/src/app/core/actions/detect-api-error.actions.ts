import {Action, createAction} from '@ngrx/store';


export enum ApiErrorActionTypes {
    SHOW_API_ERROR_BAR= '[Core api error] Show api error bar',
    HIDE_API_ERROR_BAR = '[Core api error] Hide api error bar'
}

export class ShowApiErrorBar implements Action {
    readonly type = ApiErrorActionTypes.SHOW_API_ERROR_BAR;
}

export class HideApiErrorBar implements Action {
    readonly type = ApiErrorActionTypes.HIDE_API_ERROR_BAR;

}

export const showApiErrorBar = createAction(
    '[Core api error] Show api error bar'
)

export const hideApiErrorBar = createAction(
    '[Core api error] Hide api error bar'
)

export type ApiErrorActions = ShowApiErrorBar | HideApiErrorBar;
