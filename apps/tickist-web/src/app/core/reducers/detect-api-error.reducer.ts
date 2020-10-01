import {hideApiErrorBar, showApiErrorBar} from '../actions/detect-api-error.actions';
import {Action, createReducer, on} from "@ngrx/store";

export interface ApiErrorState {
    apiError: {
        showApiErrorBar: boolean
    };
}

export const apiErrorInitialState: ApiErrorState = {
    apiError: {
        showApiErrorBar: false
    }
};

const apiErrorReducer = createReducer(
    apiErrorInitialState,
    on(showApiErrorBar, (state, props) => {
        return {
            apiError: {
                showApiErrorBar: true
            }
        };
    }),
    on(hideApiErrorBar, (state, props) => {
        return {
            apiError: {
                showApiErrorBar: false
            }
        };
    })
)

export function reducer(state: ApiErrorState, action: Action) {
    return apiErrorReducer(state, action);
}


