import {Action} from '@ngrx/store';
import {Tag} from '../../models/tags';
import {Filter} from '../../models/filter';


export const ADD_CURRENT_FILTERS = '[TAGS] ADD_CURRENT_FILTERS';
export const UPDATE_CURRENT_FILTER = '[TAGS] UPDATE_CURRENT_FILTER';

export const ADD_FILTERS = '[TAGS] ADD_FILTERS';
export const UPDATE_FILTERS = '[TAGS] UPDATE_FILTERS';



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


export type CurrentTagsFilters = AddCurrentFilters | UpdateCurrentFilter;
export type TagsFilters = AddFilters | UpdateFilters;
