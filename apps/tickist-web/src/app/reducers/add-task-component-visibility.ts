import {Action, createReducer, on} from "@ngrx/store";
import {updateAddTaskComponentVisibility} from "./actions/configuration";
import {ProjectsState} from "../core/reducers/projects/projects.reducer";

interface AddTaskComponentVisibilityState {
    visible: boolean
}

const initialState =  {
    visible: true
}

const addTaskComponentVisibilityReducer = createReducer(
    initialState,
    on(updateAddTaskComponentVisibility, (state, props) => {
        return {
            visible: props.visible
        }
    })
)

export function reducer(state: AddTaskComponentVisibilityState, action: Action) {
    return addTaskComponentVisibilityReducer(state, action);
}
