import {setCurrentTagsFilters} from '../../actions/tasks/tags-filters-tasks.actions';
import {Filter} from '@data/filter';
import {Action, createReducer, on} from "@ngrx/store";

export interface TagsFiltersTasksState {
    currentTagsFilter: Filter;
}

export const initialState: TagsFiltersTasksState = {
    currentTagsFilter: null
};

const tagsFiltersTasksReducer = createReducer(
    initialState,
    on(setCurrentTagsFilters, (state, props) => {
        return {
            currentTagsFilter: props.currentTagsFilter
        };
    })
)

export function reducer(state: TagsFiltersTasksState, action: Action) {
    return tagsFiltersTasksReducer(state, action);
}

