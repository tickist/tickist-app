import {Action} from '@ngrx/store';
import {Update} from '@ngrx/entity';
import {Project} from '../models/projects';

export enum ProjectActionTypes {
    REQUEST_ALL_PROJECTS = '[] REQUEST_ALL_PROJECTS',
    REQUEST_CREATE_PROJECT = '[] REQUEST_CREATE_PROJECT',
    ADD_PROJECTS = '[] ADD_PROJECTS',
    CREATE_PROJECT = '[] CREATE_PROJECT',
    UPDATE_PROJECT = '[] UPDATE_PROJECT',
    DELETE_PROJECT = '[] DELETE_PROJECT'
}


export class RequestsAllProjects implements Action {
    readonly type = ProjectActionTypes.REQUEST_ALL_PROJECTS;
}

export class RequestCreateProject implements Action {
    readonly type = ProjectActionTypes.REQUEST_CREATE_PROJECT;

    constructor(public payload: { project: Project }) {
    }
}

export class AddProjects implements Action {
    readonly type = ProjectActionTypes.ADD_PROJECTS;

    constructor(public payload: { projects: Project[] }) {
    }
}

export class CreateProject implements Action {
    readonly type = ProjectActionTypes.CREATE_PROJECT;

    constructor(public payload: { project: Project }) {
    }
}

export class UpdateProject implements Action {
    readonly type = ProjectActionTypes.UPDATE_PROJECT;

    constructor(public payload: { project: Update<Project> }) {
    }
}

export class DeleteProject implements Action {
    readonly type = ProjectActionTypes.DELETE_PROJECT;

    constructor(public payload: { projectId: number }) {
    }
}

export type ProjectActions = AddProjects
    | DeleteProject
    | UpdateProject
    | CreateProject
    | RequestsAllProjects
    | RequestCreateProject;
