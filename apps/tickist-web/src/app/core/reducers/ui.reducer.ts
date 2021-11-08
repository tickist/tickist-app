import {
    switchOffProgressBar,
    switchOnProgressBar,
} from "../actions/progress-bar.actions";
import { Action, createReducer, on } from "@ngrx/store";
import {
    blurOnAddTaskInput,
    blurOnSearchInput,
    focusOnAddTaskInput,
    focusOnSearchInput,
} from "../actions/ui.actions";

export interface UIState {
    searchInput: {
        focus: boolean;
    };
    addTask: {
        focus: boolean;
    };
}

export const uIInitialState: UIState = {
    searchInput: {
        focus: false,
    },
    addTask: {
        focus: false,
    },
};

const uiReducer = createReducer(
    uIInitialState,
    on(focusOnAddTaskInput, (state, props) => ({
        ...state,
        addTask: { focus: true },
    })),
    on(focusOnSearchInput, (state, props) => ({
        ...state,
        searchInput: { focus: true },
    })),
    on(blurOnAddTaskInput, (state, props) => ({
        ...state,
        addTask: { focus: false },
    })),
    on(blurOnSearchInput, (state, props) => ({
        ...state,
        searchInput: { focus: false },
    }))
);

export function reducer(state: UIState, action: Action) {
    return uiReducer(state, action);
}
