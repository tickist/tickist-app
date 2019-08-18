import {TagsFiltersTasksActions, TagsFiltersTasksActionTypes} from '../../actions/tasks/tags-filters-tasks.actions';
import {Filter} from '@data/filter';


export interface TagsFiltersTasksState {
    currentTagsFilter: Filter;
}

export const initialState: TagsFiltersTasksState = {
    currentTagsFilter: null
};

export function reducer(state = initialState, action: TagsFiltersTasksActions): TagsFiltersTasksState {
    switch (action.type) {
        case TagsFiltersTasksActionTypes.SetCurrentTagsFilters:
            return {currentTagsFilter: action.payload.currentTagsFilter};
        default:
            return state;
    }
}
