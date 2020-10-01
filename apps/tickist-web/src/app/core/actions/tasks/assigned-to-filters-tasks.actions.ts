import {createAction, props} from '@ngrx/store';
import {Filter} from '@data/filter';


export const addNewAssignedToFilter = createAction(
    '[AssignedToFiltersTasks] Add new assigned to filters',
    props<{filters: Filter[]}>()
)

export const setCurrentAssignedToFilter = createAction(
    '[AssignedToFiltersTasks] Set current assigned to filters',
    props<{currentFilter: Filter}>()

)

export const deleteNonFixedAssignedTo = createAction(
    '[AssignedToFiltersTasks] Delete non fixed assigned to'
)
