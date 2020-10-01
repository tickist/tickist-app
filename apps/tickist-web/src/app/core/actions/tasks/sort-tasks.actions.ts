import {createAction, props} from '@ngrx/store';
import {SortBy} from '@data/tasks/models/sortBy';

export const addSortByOptions = createAction(
    '[SortTasks] Add sort by options',
    props<{sortByOptions: SortBy[]}>()
);

export const setCurrentSortBy = createAction(
    '[SortTasks] Set current sortby',
    props<{currentSortBy: SortBy}>()
)

