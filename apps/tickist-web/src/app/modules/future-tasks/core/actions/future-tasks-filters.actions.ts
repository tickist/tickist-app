import {createAction, props} from '@ngrx/store';
import {Filter} from '@data/filter';


export const addFutureTasksFilters = createAction(
    '[Future Tasks Filters] Add future tasks filters',
    props<{ filters: Filter[] }>()
)

export const setCurrentFutureTaskFilter = createAction(
    '[Future Tasks Filters] Set current future task filter',
    props<{ currentFilter: Filter }>()
)


