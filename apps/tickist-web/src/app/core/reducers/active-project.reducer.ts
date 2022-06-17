import {Project} from '@data/projects';
import {clearActiveProject, setActiveProject} from '../actions/projects/active-project.actions';
import {Action, createReducer, on} from "@ngrx/store";
import {clearActiveProjectsId} from "../actions/projects/active-projects-ids.actions";


export interface ActiveProjectState {
    activeProject: Project;
}

export const initialState: ActiveProjectState = {
    activeProject: undefined
};

const activeProjectReducer = createReducer(
    initialState,
    on(setActiveProject, (state, props) => ({
            activeProject: props.project
        })),
    on(clearActiveProject, (state, props) => initialState)
)

export function reducer(state: ActiveProjectState, action: Action) {
    return activeProjectReducer(state, action);
}
