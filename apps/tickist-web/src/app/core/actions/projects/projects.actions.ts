import {Action} from '@ngrx/store';
import {Update} from '@ngrx/entity';
import {Project} from '../../../../../../../libs/data/src/lib/projects/models';
import {TagActionTypes} from '../tags.actions';

export enum ProjectActionTypes {
    QUERY_PROJECTS = '[PROJECTS] QUERY PROJECTS',
    REQUEST_ALL_PROJECTS = '[PROJECTS] REQUEST_ALL_PROJECTS',
    REQUEST_CREATE_PROJECT = '[PROJECTS] REQUEST_CREATE_PROJECT',
    ADD_PROJECTS = '[PROJECTS] ADD_PROJECTS',
    CREATE_PROJECT = '[PROJECTS] CREATE_PROJECT',
    UPDATE_PROJECT = '[PROJECTS] UPDATE_PROJECT',
    REQUEST_UPDATE_PROJECT = '[PROJECTS] REQUEST UPDATE_PROJECT',
    DELETE_PROJECT = '[PROJECTS] DELETE_PROJECT',
    REQUEST_DELETE_PROJECT = '[PROJECTS] REQUEST DELETE_PROJECT'
}


export class QueryProjects implements Action {
    readonly type = ProjectActionTypes.QUERY_PROJECTS;
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
export class RequestUpdateProject implements Action {
    readonly type = ProjectActionTypes.REQUEST_UPDATE_PROJECT;

    constructor(public payload: { project: Update<Project> }) {
    }
}

export class DeleteProject implements Action {
    readonly type = ProjectActionTypes.DELETE_PROJECT;

    constructor(public payload: { projectId: string }) {
    }
}

export class RequestDeleteProject implements Action {
    readonly type = ProjectActionTypes.REQUEST_DELETE_PROJECT;

    constructor(public payload: { projectId: string }) {
    }
}

export type ProjectActions = AddProjects
    | DeleteProject
    | QueryProjects
    | RequestDeleteProject
    | UpdateProject
    | RequestUpdateProject
    | CreateProject
    | RequestsAllProjects
    | RequestCreateProject;
