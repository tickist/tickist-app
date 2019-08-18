import {Action} from '@ngrx/store';
import {Project} from '../../../../../../libs/data/src/lib/projects/models';
import {ActiveProjectActions, ActiveProjectActionTypes} from '../actions/projects/active-project.actions';


export interface ActiveProjectState {
    activeProject: Project;
}

export const initialState: ActiveProjectState = {
    activeProject: undefined
};

export function reducer(state = initialState, action: ActiveProjectActions): ActiveProjectState {
    switch (action.type) {
        case ActiveProjectActionTypes.SetActiveProject:
            return {activeProject: action.payload.project};
        default:
            return state;
    }
}
