import {createAction, props} from '@ngrx/store';
import {Filter} from '@data/filter';


export const addMainFilters = createAction(
    '[FilterTasks] Add main filters',
    props<{filters: Filter[]}>()
)

export const setCurrentMainFilter = createAction(
    '[FiltersTasks] Set current main filter',
    props<{currentFilter: Filter}>()
)

