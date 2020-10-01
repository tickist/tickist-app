import {addProjectsFilters, setCurrentProjectFilter} from './projects-filters.actions';
import {Filter} from '@data/filter';
import {Action, createReducer, on} from "@ngrx/store";


export interface ProjectsFiltersState {
    filters: Filter[];
    currentFilter: Filter;
}

export const initialState: ProjectsFiltersState = {
    filters: [], currentFilter: undefined
};

const projectsFiltersReducer = createReducer(
    initialState,
    on(addProjectsFilters, (state, props) => {
        return {filters: props.filters, currentFilter: state.currentFilter};
    }),
    on(setCurrentProjectFilter, (state, props) => {
        return {filters: state.filters, currentFilter: props.currentFilter};
    })
)

export function reducer(state: ProjectsFiltersState, action: Action) {
    return projectsFiltersReducer(state, action);
}
