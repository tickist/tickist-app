import {Action} from '@ngrx/store';
import {Filter} from '@data/filter';



export enum FutureTasksFiltersActionTypes {
    AddFutureTasksFilters = '[Future Tasks Filters] Add future tasks filters',
    SetCurrentFutureTaskFilter = '[Future Tasks Filters] Set current future task filter'
}

export class AddFutureTasksFilters implements Action {
    readonly type = FutureTasksFiltersActionTypes.AddFutureTasksFilters;

    constructor(public payload: {filters: Filter[]}) {}
}

export class SetCurrentFutureTaskFilter implements Action {
    readonly type = FutureTasksFiltersActionTypes.SetCurrentFutureTaskFilter;

    constructor(public payload: {currentFilter: Filter}) {}
}

export type FutureTasksFiltersActions = AddFutureTasksFilters |  SetCurrentFutureTaskFilter;
