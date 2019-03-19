import {Filter} from '../models/filter';
import {MainFiltersTasksActions, MainFiltersTasksActionTypes} from '../core/actions/main-filters-tasks.actions';


export interface TasksMainFiltersState {
    filters: Filter[];
    currentFilter: Filter;
}

export const initialState: TasksMainFiltersState = {
    filters: [], currentFilter: undefined
};

export function reducer(state = initialState, action: MainFiltersTasksActions): TasksMainFiltersState {
    switch (action.type) {
        case MainFiltersTasksActionTypes.AddMainFilters:
            return {filters: action.payload.filters, currentFilter: state.currentFilter};
        case MainFiltersTasksActionTypes.SetCurrentMainFilter:
            return {filters: state.filters, currentFilter: action.payload.currentFilter};
        default:
            return state;
    }
}