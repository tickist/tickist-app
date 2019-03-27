import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {ProjectActions, ProjectActionTypes} from '../../actions/projects/projects.actions';
import {Project} from '../../../models/projects';
import {TickistActions, TickistActionTypes} from '../../../tickist.actions';

export interface ProjectsState extends EntityState<Project> {
    allProjectsLoaded: boolean;
}

export const adapter: EntityAdapter<Project> =
    createEntityAdapter<Project>();


export const initialProjectsState: ProjectsState = adapter.getInitialState({
    allProjectsLoaded: false
});


export function reducer(state = initialProjectsState, action: (ProjectActions | TickistActions)): ProjectsState {
    switch (action.type) {
        case ProjectActionTypes.CREATE_PROJECT:
            return adapter.addOne(action.payload.project, state);

        case ProjectActionTypes.ADD_PROJECTS:
            return adapter.addAll(action.payload.projects, {...state, allProjectsLoaded: true});

        case ProjectActionTypes.UPDATE_PROJECT:
            return adapter.updateOne(action.payload.project, state);

        case ProjectActionTypes.DELETE_PROJECT:
            return adapter.removeOne(action.payload.projectId, state);

        case TickistActionTypes.ResetStore:
            return initialProjectsState;

        default:
            return state;
    }
}

export const {
    selectAll,
    selectEntities,
    selectIds,
    selectTotal

} = adapter.getSelectors();
