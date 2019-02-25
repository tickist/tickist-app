import {Action} from '@ngrx/store';


export enum OfflineModeActionTypes {
    SHOW_OFFLINE_MODE_BAR = '[Core offline mode bar] Show offline mode bar',
    HIDE_OFFLINE_MODE_BAR = '[Core offline mode bar] Hide offline mode bar'
}

export class ShowOfflineModeBar implements Action {
    readonly type = OfflineModeActionTypes.SHOW_OFFLINE_MODE_BAR;
}

export class HideOfflineModeBar implements Action {
    readonly type = OfflineModeActionTypes.HIDE_OFFLINE_MODE_BAR;

}

export type OfflineModeActions = ShowOfflineModeBar | HideOfflineModeBar;
