import {Action} from '@ngrx/store';
import {Filter} from '@tickist/data/filter';

export enum MainFiltersTasksActionTypes {
    AddMainFilters = '[FilterTasks] Add main filters',
    SetCurrentMainFilter = '[FiltersTasks] Set current main filter'
}

export class AddMainFilters implements Action {
    readonly type = MainFiltersTasksActionTypes.AddMainFilters;

    constructor(public payload: {filters: Filter[]}) {}
}

export class SetCurrentMainFilter implements Action {
    readonly type = MainFiltersTasksActionTypes.SetCurrentMainFilter;

    constructor(public payload: {currentFilter: Filter}) {}
}

export type MainFiltersTasksActions = AddMainFilters |  SetCurrentMainFilter;
