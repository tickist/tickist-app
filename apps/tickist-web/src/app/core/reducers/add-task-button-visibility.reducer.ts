import {hideAddTaskButton, showAddTaskButton} from '../actions/add-task-button-visibility.actions';
import {Action, createReducer, on} from "@ngrx/store";


export interface AddTaskButtonVisibilityState {
    addTaskButtonVisibility: {
        isVisible: boolean
    };
}

export const addTaskButtonInitialState: AddTaskButtonVisibilityState = {
    addTaskButtonVisibility: {
        isVisible: true
    }
};

const addTaskButtonVisibilityReducer = createReducer(
    addTaskButtonInitialState,
    on(showAddTaskButton, (state, props) => {
        return {
            addTaskButtonVisibility: {
                isVisible: true
            }
        };
    }),
    on(hideAddTaskButton, (state, props) => {
        return {
            addTaskButtonVisibility: {
                isVisible: false
            }
        };
    })
)

export function reducer(state: AddTaskButtonVisibilityState, action: Action) {
    return addTaskButtonVisibilityReducer(state, action);
}

