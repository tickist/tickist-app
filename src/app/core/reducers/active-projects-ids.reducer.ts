import {ActiveProjectsIdActionTypes, ActiveProjectsIdsActions} from '../actions/projects/active-projects-ids.actions';


export interface ActiveProjectsIdsState {
    projectsIds: Array<string>;
}

export const initialState: ActiveProjectsIdsState = {
    projectsIds: []
};

export function reducer(state = initialState, action: ActiveProjectsIdsActions): ActiveProjectsIdsState {
    switch (action.type) {
        case ActiveProjectsIdActionTypes.NewActiveProjectsIds:
            return {
                projectsIds: action.payload.projectsIds
            };
        case ActiveProjectsIdActionTypes.AddNewActiveProjectId:
            return {
                projectsIds: [...state.projectsIds, action.payload.projectId]
            };
        case ActiveProjectsIdActionTypes.DeleteActiveProjectId:
            const index = state.projectsIds.indexOf(action.payload.projectId);
            return {
                projectsIds: [
                    ...state.projectsIds.slice(0, index),
                    ...state.projectsIds.slice(index + 1)
                ]
            };
        default:
            return state;
    }
}
