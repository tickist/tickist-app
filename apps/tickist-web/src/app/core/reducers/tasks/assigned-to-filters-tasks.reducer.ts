import {
    addNewAssignedToFilter,
    deleteNonFixedAssignedTo,
    setCurrentAssignedToFilter,
} from "../../actions/tasks/assigned-to-filters-tasks.actions";
import { Filter } from "@data/filter";
import { Action, createReducer, on } from "@ngrx/store";

export interface AssignedToFiltersTasks {
    filters: Filter[];
    currentFilter: Filter;
}

export const initialState: AssignedToFiltersTasks = {
    filters: [],
    currentFilter: undefined,
};

const assignedToFiltersTasksReducer = createReducer(
    initialState,
    on(addNewAssignedToFilter, (state, props) => ({
        filters: [...state.filters.filter((filter) => filter.fixed), ...props.filters],
        currentFilter: state.currentFilter,
    })),
    on(deleteNonFixedAssignedTo, (state) => ({
        filters: state.filters.filter((filter) => filter.fixed),
        currentFilter: state.currentFilter.fixed ? state.currentFilter : undefined,
    })),
    on(setCurrentAssignedToFilter, (state, props) => ({ filters: state.filters, currentFilter: props.currentFilter })),
);

export function reducer(state: AssignedToFiltersTasks, action: Action) {
    return assignedToFiltersTasksReducer(state, action);
}
