import {
    addNewActiveProjectId,
    clearActiveProjectsId,
    deleteActiveProjectId,
    newActiveProjectsIds
} from '../actions/projects/active-projects-ids.actions';
import {Action, createReducer, on} from "@ngrx/store";


export interface ActiveProjectsIdsState {
    projectsIds: Array<string>;
}

export const initialState: ActiveProjectsIdsState = {
    projectsIds: []
};

const activeProjectsIdsReducer = createReducer(
    initialState,
    on(newActiveProjectsIds, (state, props) => {
        return {
            projectsIds: props.projectsIds
        };
    }),
    on(addNewActiveProjectId, (state, props) => {
        return {
            projectsIds: [...state.projectsIds, props.projectId]
        }
    } ),
    on(deleteActiveProjectId,  (state, props) => {
        const index = state.projectsIds.indexOf(props.projectId);
        return {
            projectsIds: [
                ...state.projectsIds.slice(0, index),
                ...state.projectsIds.slice(index + 1)
            ]
        };
    }),
    on(clearActiveProjectsId, (state, props) => {
        return initialState
    })
)

export function reducer(state: ActiveProjectsIdsState, action: Action) {
    return activeProjectsIdsReducer(state, action);
}
