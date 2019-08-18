import {Filter} from '@tickist/data/filter';
import {ProjectsFiltersActions, ProjectsFiltersActionTypes} from './projects-filters.actions';


export interface ProjectsFiltersState {
    filters: Filter[];
    currentFilter: Filter;
}

export const initialState: ProjectsFiltersState = {
    filters: [], currentFilter: undefined
};

export function reducer(state = initialState, action: ProjectsFiltersActions): ProjectsFiltersState {
    switch (action.type) {
        case ProjectsFiltersActionTypes.AddProjectsFilters:
            return {filters: action.payload.filters, currentFilter: state.currentFilter};
        case ProjectsFiltersActionTypes.SetCurrentProjectFilter:
            return {filters: state.filters, currentFilter: action.payload.currentFilter};
        default:
            return state;
    }
}
