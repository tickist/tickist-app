import {addFutureTasksFilters, setCurrentFutureTaskFilter} from '../actions/future-tasks-filters.actions';
import {Filter} from '@data/filter';
import {Action, createReducer, on} from "@ngrx/store";


export interface FutureTasksFiltersState {
    filters: Filter[];
    currentFilter: Filter;
}

export const initialState: FutureTasksFiltersState = {
    filters: [], currentFilter: undefined
};

const futureTasksFiltersReducer = createReducer(
    initialState,
    on(addFutureTasksFilters, (state, props) => ({
            filters: props.filters, currentFilter: state.currentFilter
        })),
    on(setCurrentFutureTaskFilter, (state, props) => ({
            filters: state.filters, currentFilter: props.currentFilter
        }))
)

export function reducer(state: FutureTasksFiltersState, action: Action) {
    return futureTasksFiltersReducer(state, action);
}

