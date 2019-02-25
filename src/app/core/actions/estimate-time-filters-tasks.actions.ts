import {Action} from '@ngrx/store';
import {Filter} from '../../models/filter';

export enum EstimateTimeFiltersTasksActionTypes {
    AddEstimateTimeFiltersTasks = '[EstimateTimeFiltersTasks] Add estimate time filters tasks',
    SetCurrentEstimateTimeFiltersTasks = '[EstimateTimeFiltersTasks] Set current estimate time filters tasks'
}

export class AddEstimateTimeFiltersTasks implements Action {
    readonly type = EstimateTimeFiltersTasksActionTypes.AddEstimateTimeFiltersTasks;

    constructor(public payload: {filters_lt: Filter[], filters_gt: Filter[]}) {
    }
}

export class SetCurrentEstimateTimeFiltersTasks implements Action {
    readonly type = EstimateTimeFiltersTasksActionTypes.SetCurrentEstimateTimeFiltersTasks;

    constructor(public payload: {currentFilter_lt: Filter, currentFilter_gt: Filter}) {}
}

export type EstimateTimeFiltersTasksActions = AddEstimateTimeFiltersTasks | SetCurrentEstimateTimeFiltersTasks;
