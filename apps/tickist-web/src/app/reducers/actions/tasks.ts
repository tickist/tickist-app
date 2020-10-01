
import {Action, createAction, props} from '@ngrx/store';
import {Filter} from '@data/filter';


export const addCurrentFilters= createAction(
    'ADD_CURRENT_FILTERS',
    props<{filters: Filter[]}>()
)

export const updateCurrentFilter= createAction(
    'UPDATE_CURRENT_FILTER',
    props<{filter: Filter}>()
)

export const addFilters= createAction(
    '[TASKS] ADD_FILTERS',
    props<{filters: Filter[]}>()
)

export const updateFilters= createAction(
    '[TASKS] UPDATE_FILTERS',
    props<{filter: Filter}>()
)

export const updateFutureTasksFilters= createAction(
    '[TASKS] UPDATE_FUTURE_TASKS_FILTERS',
    props<{filter: Filter}>()
)

export const addFutureTasksFilters= createAction(
    '[TASKS] ADD_FUTURE_TASKS_FILTERS',
    props<{filters: Filter[]}>()
)

export const updateCurrentFutureTasksFilters = createAction(
    'UPDATE_CURRENT_FUTURE_TASKS_FILTER',
    props<{filter: Filter}>()
)

export const addCurrentFutureTasksFilters = createAction(
    'ADD_CURRENT_FUTURE_TASKS_FILTERS',
    props<{filter: Filter}>()
)

