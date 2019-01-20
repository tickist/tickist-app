import {createFeatureSelector, createSelector} from '@ngrx/store';
import {SortByState} from './sort-tasks.reducer';


export const selectSortByState = createFeatureSelector<SortByState>('sortTasks');

export const selectCurrentSortBy = createSelector(
    selectSortByState,
    sortByState => sortByState.currentSortBy
);

export const selectSortByOptions = createSelector(
    selectSortByState,
    sortByState => sortByState.sortByOptions
);
