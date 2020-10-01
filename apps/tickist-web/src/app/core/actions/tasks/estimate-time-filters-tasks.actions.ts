import {createAction, props} from '@ngrx/store';
import {Filter} from '@data/filter';


export const addEstimateTimeFiltersTasks = createAction(
    '[EstimateTimeFiltersTasks] Add estimate time filters tasks',
    props<{filters_lt: Filter[], filters_gt: Filter[]}>()
)

export const setCurrentEstimateTimeFiltersTasks = createAction(
    '[EstimateTimeFiltersTasks] Set current estimate time filters tasks',
    props<{currentFilter_lt: Filter, currentFilter_gt: Filter}>()
)

