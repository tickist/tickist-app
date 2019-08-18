import {Filter} from '../../../../../../../../libs/data/src/lib/filter';
import {TagsFiltersActions, TagsFiltersActionTypes} from './tags-filters.actions';




export interface TagsFiltersState {
    filters: Filter[];
    currentFilter: Filter;
}

export const initialState: TagsFiltersState = {
    filters: [], currentFilter: undefined
};

export function reducer(state = initialState, action: TagsFiltersActions): TagsFiltersState {
    switch (action.type) {
        case TagsFiltersActionTypes.AddTagsFilters:
            return {filters: action.payload.filters, currentFilter: state.currentFilter};
        case TagsFiltersActionTypes.SetCurrentTagsListFilter:
            return {filters: state.filters, currentFilter: action.payload.currentFilter};
        default:
            return state;
    }
}
