import {Action} from '@ngrx/store';
import {ApiErrorActionTypes} from '../actions/detect-api-error.actions';
import {AddTaskButtonVisibilityActions, AddTaskButtonVisibilityActionTypes} from '../actions/add-task-button-visibility.actions';


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

export function reducer(state = addTaskButtonInitialState, action: AddTaskButtonVisibilityActions): AddTaskButtonVisibilityState {
    switch (action.type) {
        case AddTaskButtonVisibilityActionTypes.ShowAddTaskButton:
            return {
                addTaskButtonVisibility: {
                    isVisible: true
                }
            };
        case AddTaskButtonVisibilityActionTypes.HideAddTaskButton:
            return {
                addTaskButtonVisibility: {
                    isVisible: false
                }
            };
        default:
            return state;
    }
}
