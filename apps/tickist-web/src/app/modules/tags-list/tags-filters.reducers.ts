import {addTagsFilters, setCurrentTagsListFilter} from './tags-filters.actions';
import {Filter} from '@data/filter';
import {Action, createReducer, on} from "@ngrx/store";


export interface TagsFiltersState {
    filters: Filter[];
    currentFilter: Filter;
}

export const initialState: TagsFiltersState = {
    filters: [], currentFilter: undefined
};

const tagsFiltersReducer = createReducer(
    initialState,
    on(addTagsFilters, (state, props) => ({filters: props.filters, currentFilter: state.currentFilter})),
    on(setCurrentTagsListFilter, (state, props) => ({filters: state.filters, currentFilter: props.currentFilter}))
)

export function reducer(state: TagsFiltersState, action: Action) {
    return tagsFiltersReducer(state, action);
}


