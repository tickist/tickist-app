import { Action } from '@ngrx/store';
import {Filter} from '../models/filter';
import {TagsFiltersTasksActions, TagsFiltersTasksActionTypes} from './tags-filters-tasks.actions';


export interface TagsFiltersTasksState {
    currentTagsFilter: Filter;
}

export const initialState: TagsFiltersTasksState = {
    currentTagsFilter: undefined
};

export function reducer(state = initialState, action: TagsFiltersTasksActions): TagsFiltersTasksState {
  switch (action.type) {
      case TagsFiltersTasksActionTypes.SetCurrentTagsFilters:
          return {currentTagsFilter: action.payload.currentTagsFilter};
    default:
      return state;
  }
}
