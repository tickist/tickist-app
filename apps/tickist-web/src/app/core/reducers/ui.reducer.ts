import {switchOffProgressBar, switchOnProgressBar} from '../actions/progress-bar.actions';
import {Action, createReducer, on} from "@ngrx/store";
import {blurOnAddTaskInput, blurOnSearchInput, focusOnAddTaskInput, focusOnSearchInput} from "../actions/ui.actions";

export interface UIState {
    searchInput: {
        focus: boolean
    },
    addTask: {
        focus: boolean
    }
}

export const UIInitialState: UIState = {
    searchInput: {
        focus: false
    },
    addTask: {
        focus: false
    }
};

const uiReducer = createReducer(
    UIInitialState,
    on(focusOnAddTaskInput, (state, props) => {
        return {
            ...state,
            addTask: {focus: true}
        };
    }),
    on(focusOnSearchInput, (state, props) => {
        return {
            ...state,
            searchInput: {focus: true}
        };
    }),
    on(blurOnAddTaskInput, (state, props) => {
        return {
            ...state,
            addTask: {focus: false}

        };
    }),
    on(blurOnSearchInput, (state, props) => {
        return {
            ...state,
            searchInput: {focus: false}
        };
    })
)

export function reducer(state: UIState, action: Action) {
    return uiReducer(state, action);
}
