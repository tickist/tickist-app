import {Action} from '@ngrx/store';
import {Project} from '../../models/projects';
import {Filter} from '../../models/filter';

export const ADD_PROJECTS = 'ADD_PROJECTS';
export const CREATE_PROJECT = 'CREATE_PROJECT';
export const UPDATE_PROJECT = 'UPDATE_PROJECT';
export const DELETE_PROJECT = 'DELETE_PROJECT';
export const SELECT_PROJECT = 'SELECT_PROJECT';

export const ADD_CURRENT_FILTERS = '[PROJECTS] ADD_CURRENT_FILTERS';
export const UPDATE_CURRENT_FILTER = '[PROJECTS] UPDATE_CURRENT_FILTER';

export const ADD_FILTERS = '[PROJECTS] ADD_FILTERS';
export const UPDATE_FILTERS = '[PROJECTS] UPDATE_FILTERS';

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


export type CurrentProjectsFilters = AddCurrentFilters | UpdateCurrentFilter;
export type ProjectsFilters = AddFilters | UpdateFilters;
