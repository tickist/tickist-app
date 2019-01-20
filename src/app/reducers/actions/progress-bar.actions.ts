import {Action} from '@ngrx/store';


export enum ProgressBarActionTypes {
    SWITCH_OFF_PROGRESS_BAR = '[Core progress bar] Switch off progress bar',
    SWITCH_ON_PROGRESS_BAR = '[Core progress bar] Switch on progress bar'
}

export class SwitchOffProgressBar implements Action {
    readonly type = ProgressBarActionTypes.SWITCH_OFF_PROGRESS_BAR;
}

export class SwitchOnProgressBar implements Action {
    readonly type = ProgressBarActionTypes.SWITCH_ON_PROGRESS_BAR;

}

export type ProgressBarActions = SwitchOffProgressBar
    | SwitchOnProgressBar;
