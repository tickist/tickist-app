import {Filter} from '../models/filter';
import {AssignedToFiltersTasksActions, AssignedToFiltersTasksActionTypes} from '../core/actions/assigned-to-filters-tasks.actions';


export interface AssignedToFiltersTasks {
    filters: Filter[];
    currentFilter: Filter;

}

export const initialState: AssignedToFiltersTasks = {
    filters: [],
    currentFilter: undefined
};

export function reducer(state = initialState, action: AssignedToFiltersTasksActions): AssignedToFiltersTasks {
    switch (action.type) {
        case AssignedToFiltersTasksActionTypes.AddNewAssignedToFilter:
            return {filters: [...state.filters, ...action.payload.filters], currentFilter: state.currentFilter};
        case AssignedToFiltersTasksActionTypes.DeleteNonFixedAssignedTo:
            return {
                filters: state.filters.filter(filter => filter.fixed),
                currentFilter: state.currentFilter.fixed ? state.currentFilter : undefined
            };
        case AssignedToFiltersTasksActionTypes.SetCurrentAssingedToFilter:
            return {filters: state.filters, currentFilter: action.payload.currentFilter};
        default:
            return state;
    }
}
