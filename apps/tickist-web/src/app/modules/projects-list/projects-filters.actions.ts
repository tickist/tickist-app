import {createAction, props} from '@ngrx/store';
import {Filter} from '@data/filter';


export const addProjectsFilters= createAction(
    '[Tags Filters] Add projects filters',
    props<{filters: Filter[]}>()
)
export const setCurrentProjectFilter= createAction(
    '[Tags Filters] Set current tag filter',
    props<{currentFilter: Filter}>()
)

