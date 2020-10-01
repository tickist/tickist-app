import {createAction, props} from '@ngrx/store';
import {Update} from '@ngrx/entity';
import {Project} from '@data/projects';


export const queryProjects = createAction(
    '[PROJECTS] QUERY PROJECTS'
);
export const requestsAllProjects = createAction(
    '[PROJECTS] REQUEST_ALL_PROJECTS'
);
export const requestCreateProject = createAction(
    '[PROJECTS] REQUEST_CREATE_PROJECT',
    props<{ project: Project }>()
);
export const addProjects = createAction(
    '[PROJECTS] ADD_PROJECTS',
    props<{ projects: Project[] }>()
);
export const createProject = createAction(
    '[PROJECTS] CREATE_PROJECT',
    props<{ project: Project }>()
);
export const updateProject = createAction(
    '[PROJECTS] UPDATE_PROJECT',
    props<{ project: Update<Project> }>()
);
export const requestUpdateProject = createAction(
    '[PROJECTS] REQUEST UPDATE_PROJECT',
    props<{ project: Update<Project> }>()
);
export const deleteProject = createAction(
    '[PROJECTS] DELETE_PROJECT',
    props<{ projectId: string }>()
);
export const requestDeleteProject = createAction(
    '[PROJECTS] REQUEST DELETE_PROJECT',
    props<{ projectId: string }>()
);



