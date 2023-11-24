import { Action, createReducer, on } from "@ngrx/store";
import { blurOnAddTaskInput, blurOnSearchInput, focusOnAddTaskInput, focusOnSearchInput } from "../actions/ui.actions";

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
    on(focusOnAddTaskInput, (state) => ({
        ...state,
        addTask: { focus: true },
    })),
    on(focusOnSearchInput, (state) => ({
        ...state,
        searchInput: { focus: true },
    })),
    on(blurOnAddTaskInput, (state) => ({
        ...state,
        addTask: { focus: false },
    })),
    on(blurOnSearchInput, (state) => ({
        ...state,
        searchInput: { focus: false },
    })),
);

export function reducer(state: UIState, action: Action) {
    return uiReducer(state, action);
}
