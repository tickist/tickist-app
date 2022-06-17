import {switchOffProgressBar, switchOnProgressBar} from '../actions/progress-bar.actions';
import {Action, createReducer, on} from "@ngrx/store";

export interface ProgressBarState {
    progressBar: {
        isEnabled: boolean
    };
}

export const progressBarInitialState: ProgressBarState = {
    progressBar: {
        isEnabled: false
    }
};

const progressBarReducer = createReducer(
    progressBarInitialState,
    on(switchOffProgressBar, (state, props) => ({
            progressBar: {isEnabled: false}
        })),
    on(switchOnProgressBar, (state, props) => ({
            progressBar: {isEnabled: true}
        }))
)

export function reducer(state: ProgressBarState, action: Action) {
    return progressBarReducer(state, action);
}
