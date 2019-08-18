import {Filter} from '@tickist/data/filter';
import {FutureTasksFiltersActions, FutureTasksFiltersActionTypes} from './future-tasks-filters.actions';


export interface FutureTasksFiltersState {
    filters: Filter[];
    currentFilter: Filter;
}

export const initialState: FutureTasksFiltersState = {
    filters: [], currentFilter: undefined
};

export function reducer(state = initialState, action: FutureTasksFiltersActions): FutureTasksFiltersState {
    switch (action.type) {
        case FutureTasksFiltersActionTypes.AddFutureTasksFilters:
            return {filters: action.payload.filters, currentFilter: state.currentFilter};
        case FutureTasksFiltersActionTypes.SetCurrentFutureTaskFilter:
            return {filters: state.filters, currentFilter: action.payload.currentFilter};
        default:
            return state;
    }
}
