import {MainFiltersTasksActions, MainFiltersTasksActionTypes} from '../../actions/tasks/main-filters-tasks.actions';
import {Filter} from '@data/filter';


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
