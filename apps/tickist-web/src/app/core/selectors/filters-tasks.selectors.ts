import {createFeatureSelector, createSelector} from '@ngrx/store';
import {TasksMainFiltersState} from '../reducers/tasks/main-filters-tasks.reducer';
import {AssignedToFiltersTasks} from '../reducers/tasks/assigned-to-filters-tasks.reducer';
import {EstimateTimeFiltersState} from '../reducers/tasks/estimate-time-filters-tasks.reducer';
import {SearchTaskState} from '../reducers/tasks/search-tasks.reducer';
import {TagsFiltersTasksState} from '../reducers/tasks/tags-filters-tasks.reducer';


export const selectTasksMainFiltersState = createFeatureSelector<TasksMainFiltersState>('mainFiltersTasks');
export const selectAssignedToFiltersState = createFeatureSelector<AssignedToFiltersTasks>('assignedToFiltersTasks');
export const selectEstimateTimeFiltersState = createFeatureSelector<EstimateTimeFiltersState>('estimateTimeFiltersTasks');
export const selectTagsFiltersState = createFeatureSelector<TagsFiltersTasksState>('tagsFiltersTasks');
export const selectSearchTasksState = createFeatureSelector<SearchTaskState>('searchTasks');


export const selectCurrentMainFilter = createSelector(
    selectTasksMainFiltersState,
    tasksMainFiltersState => tasksMainFiltersState.currentFilter
);

export const selectMainFilters = createSelector(
    selectTasksMainFiltersState,
    tasksMainFiltersState => tasksMainFiltersState.filters
);

export const selectCurrentAssignedToFilter = createSelector(
    selectAssignedToFiltersState,
    assignedToFiltersStat => assignedToFiltersStat.currentFilter
);

export const selectAssignedToFilters = createSelector(
    selectAssignedToFiltersState,
    assignedToFiltersState => assignedToFiltersState.filters
);

export const selectCurrentTagsFilter = createSelector(
    selectTagsFiltersState,
    tagsFiltersState => {
        if (!tagsFiltersState) return;
        return tagsFiltersState.currentTagsFilter;
    }
);

export const selectSearchTasksText = createSelector(
    selectSearchTasksState,
    searchTasksText => searchTasksText.searchText
);

export const selectSearchTasksTextIsEnabled = createSelector(
    selectSearchTasksText,
    searchTasksText => !!searchTasksText
);

export const selectCurrentEstimateTimeFilter = createSelector(
    selectEstimateTimeFiltersState,
    assignedToFiltersState => {
        return {currentFilter_lt: assignedToFiltersState.currentFilter_lt, currentFilter_gt: assignedToFiltersState.currentFilter_gt};
    }
);

export const selectEstimateTimeFilters = createSelector(
    selectEstimateTimeFiltersState,
    assignedToFiltersState => {
        return {
            filters_lt: assignedToFiltersState.filters_lt,
            filters_gt: assignedToFiltersState.filters_lt
        };
    }
);


