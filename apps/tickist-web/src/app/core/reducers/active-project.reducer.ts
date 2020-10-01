import {Project} from '@data/projects';
import {setActiveProject} from '../actions/projects/active-project.actions';
import {Action, createReducer, on} from "@ngrx/store";


export interface ActiveProjectState {
    activeProject: Project;
}

export const initialState: ActiveProjectState = {
    activeProject: undefined
};

const activeProjectReducer = createReducer(
    initialState,
    on(setActiveProject, (state, props) => {
        return  {
            activeProject: props.project
        }
    })
)

export function reducer(state: ActiveProjectState, action: Action) {
    return activeProjectReducer(state, action);
}
