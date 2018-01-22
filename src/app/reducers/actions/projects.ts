import {Action} from '@ngrx/store';
import {Project} from '../../models/projects';
import {Filter} from '../../models/filter';

export const ADD_PROJECTS = 'ADD_PROJECTS';
export const CREATE_PROJECT = 'CREATE_PROJECT';
export const UPDATE_PROJECT = 'UPDATE_PROJECT';
export const DELETE_PROJECT = 'DELETE_PROJECT';
export const SELECT_PROJECT = 'SELECT_PROJECT';

export const NEW_IDS = 'NEW_IDS';
export const ADD_NEW_ID = 'ADD_NEW_ID';
export const DELETE_ID = 'DELETE_ID';

export const ADD_CURRENT_FILTERS = '[PROJECTS] ADD_CURRENT_FILTERS';
export const UPDATE_CURRENT_FILTER = '[PROJECTS] UPDATE_CURRENT_FILTER';

export const ADD_FILTERS = '[PROJECTS] ADD_FILTERS';
export const UPDATE_FILTERS = '[PROJECTS] UPDATE_FILTERS';


export class AddProjects implements Action {
  readonly type = ADD_PROJECTS;

  constructor(public payload: Project[]) {}
}

export class CreateProject implements Action {
  readonly type = CREATE_PROJECT;

  constructor(public payload: Project) {}
}

export class UpdateProject implements Action {
  readonly type = UPDATE_PROJECT;

  constructor(public payload: Project) {}
}

export class DeleteProject implements Action {
  readonly type = DELETE_PROJECT;

  constructor(public payload: Project) {}
}

export class SelectProject implements Action {
  readonly type = SELECT_PROJECT;

  constructor(public payload: Project) {}
}

export class NewIds implements Action {
  readonly type = NEW_IDS;

  constructor(public payload: Array<number>) {}
}

export class AddNewId implements Action {
  readonly type = ADD_NEW_ID;

  constructor(public payload: number) {}
}

export class DeleteId implements Action {
  readonly type = DELETE_ID;

  constructor(public payload: number) {}
}

export class AddCurrentFilters implements Action {
  readonly type = ADD_CURRENT_FILTERS;

  constructor(public payload: Filter) {
  }
}

export class UpdateCurrentFilter implements Action {
  readonly type = UPDATE_CURRENT_FILTER;

  constructor(public payload: Filter[]) {
  }
}

export class AddFilters implements Action {
  readonly type = ADD_FILTERS;

  constructor(public payload: Filter[]) {
  }
}

export class UpdateFilters implements Action {
  readonly type = UPDATE_FILTERS;

  constructor(public payload: Filter) {
  }
}


export type ProjectsActions = AddProjects | CreateProject | UpdateProject | DeleteProject;
export type SelectProjectActions = SelectProject;
export type SelectedProjectsIdsActions =  NewIds |AddNewId | DeleteId;
export type CurrentProjectsFilters = AddCurrentFilters | UpdateCurrentFilter;
export type ProjectsFilters = AddFilters | UpdateFilters;
