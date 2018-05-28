import {Action} from '@ngrx/store';
import {Tag} from '../../models/tags';
import {Filter} from '../../models/filter';
export const ADD_TAGS = 'ADD_TAGS';
export const CREATE_TAG = 'CREATE_TAG';
export const UPDATE_TAG = 'UPDATE_TAG';
export const DELETE_TAG = 'DELETE_TAG';

export const ADD_CURRENT_FILTERS = '[TAGS] ADD_CURRENT_FILTERS';
export const UPDATE_CURRENT_FILTER = '[TAGS] UPDATE_CURRENT_FILTER';

export const ADD_FILTERS = '[TAGS] ADD_FILTERS';
export const UPDATE_FILTERS = '[TAGS] UPDATE_FILTERS';



export class AddTags implements Action {
  readonly type = ADD_TAGS;

  constructor(public payload: Tag[]) {
  }
}

export class CreateTag implements Action {
  readonly type = CREATE_TAG;

  constructor(public payload: Tag) {
  }
}

export class UpdateTag implements Action {
  readonly type = UPDATE_TAG;

  constructor(public payload: Tag) {
  }
}

export class DeleteTag implements Action {
  readonly type = DELETE_TAG;

  constructor(public payload: Tag) {
  }
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


export type Actions = AddTags | CreateTag | UpdateTag | DeleteTag;
export type CurrentTagsFilters = AddCurrentFilters | UpdateCurrentFilter;
export type TagsFilters = AddFilters | UpdateFilters;
