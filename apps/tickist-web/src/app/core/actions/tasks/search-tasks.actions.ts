import {createAction, props} from '@ngrx/store';


export const setCurrrentSearchTasksFilter= createAction(
    '[SearchTasks] Set current search tasks filter',
    props<{searchText: string}>()
)


