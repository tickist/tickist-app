import { Action, createReducer, on } from "@ngrx/store";
import { updateAddTaskComponentVisibility } from "./actions/configuration";

interface AddTaskComponentVisibilityState {
    visible: boolean;
}

const initialState = {
    visible: true,
};

const addTaskComponentVisibilityReducer = createReducer(
    initialState,
    on(updateAddTaskComponentVisibility, (state, props) => ({
        visible: props.visible,
    })),
);

export function reducer(state: AddTaskComponentVisibilityState, action: Action) {
    return addTaskComponentVisibilityReducer(state, action);
}
