import {Action} from '@ngrx/store';


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

export type ApiErrorActions = ShowApiErrorBar | HideApiErrorBar;
