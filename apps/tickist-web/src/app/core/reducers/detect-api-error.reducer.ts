import {ApiErrorActions, ApiErrorActionTypes} from '../actions/detect-api-error.actions';

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


export function reducer(state: ApiErrorState = apiErrorInitialState, action: ApiErrorActions) {
    switch (action.type) {
        case ApiErrorActionTypes.SHOW_API_ERROR_BAR:
            return {
                apiError: {
                    showApiErrorBar: true
                }
            };
        case ApiErrorActionTypes.HIDE_API_ERROR_BAR:
            return {
                apiError: {
                    showApiErrorBar: false
                }
            };
        default:
            return state;
    }
}

