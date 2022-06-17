import {addMainFilters, setCurrentMainFilter} from '../../actions/tasks/main-filters-tasks.actions';
import {Filter} from '@data/filter';
import {Action, createReducer, on} from "@ngrx/store";


export interface TasksMainFiltersState {
    filters: Filter[];
    currentFilter: Filter;
}

export const initialState: TasksMainFiltersState = {
    filters: [], currentFilter: undefined
};

const tasksMainFiltersReducer = createReducer(
    initialState,
    on(addMainFilters, (state, props) => ({filters: props.filters, currentFilter: state.currentFilter})),
    on(setCurrentMainFilter, (state, props) => ({filters: state.filters, currentFilter: props.currentFilter}))
)


export function reducer(state: TasksMainFiltersState, action: Action) {
    return tasksMainFiltersReducer(state, action);
}

