import {ProgressBarActions, ProgressBarActionTypes} from './actions/progress-bar.actions';

export interface ProgressBarState {
    isEnabled: boolean;
}

export const progressBarInitialState: ProgressBarState = {
    isEnabled: false
};


export function reducer(state: ProgressBarState = progressBarInitialState, action: ProgressBarActions) {
    switch (action.type) {
        case ProgressBarActionTypes.SWITCH_OFF_PROGRESS_BAR:
            return {isEnabled: false};
        case ProgressBarActionTypes.SWITCH_ON_PROGRESS_BAR:
            return {isEnabled: true};
        default:
            return state;
    }
}
