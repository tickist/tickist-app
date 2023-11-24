import { hideAddTaskButton, showAddTaskButton } from "../actions/add-task-button-visibility.actions";
import { Action, createReducer, on } from "@ngrx/store";

export interface AddTaskButtonVisibilityState {
    addTaskButtonVisibility: {
        isVisible: boolean;
    };
}

export const addTaskButtonInitialState: AddTaskButtonVisibilityState = {
    addTaskButtonVisibility: {
        isVisible: true,
    },
};

const addTaskButtonVisibilityReducer = createReducer(
    addTaskButtonInitialState,
    on(showAddTaskButton, () => ({
        addTaskButtonVisibility: {
            isVisible: true,
        },
    })),
    on(hideAddTaskButton, () => ({
        addTaskButtonVisibility: {
            isVisible: false,
        },
    })),
);

export function reducer(state: AddTaskButtonVisibilityState, action: Action) {
    return addTaskButtonVisibilityReducer(state, action);
}
