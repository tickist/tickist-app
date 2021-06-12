import {createAction, props} from '@ngrx/store';


export const setCurrentSearchTasksFilter = createAction(
    '[SearchTasks] Set current search tasks filter',
    props<{searchText: string}>()
)

export const clearSearchTasksFilter = createAction(
    '[SearchTasks] Clear search filter'
)

export const goToElement = createAction(
    '[SearchTasks] Go to element'
)
