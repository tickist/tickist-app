import {Action} from '@ngrx/store';
import {Filter} from '../../../../../../../../libs/data/src/lib/filter';



export enum ProjectsFiltersActionTypes {
    AddProjectsFilters = '[Tags Filters] Add projects filters',
    SetCurrentProjectFilter = '[Tags Filters] Set current tag filter'
}

export class AddProjectsFilters implements Action {
    readonly type = ProjectsFiltersActionTypes.AddProjectsFilters;

    constructor(public payload: {filters: Filter[]}) {}
}

export class SetCurrentProjectFilter implements Action {
    readonly type = ProjectsFiltersActionTypes.SetCurrentProjectFilter;

    constructor(public payload: {currentFilter: Filter}) {}
}

export type ProjectsFiltersActions = AddProjectsFilters |  SetCurrentProjectFilter;
