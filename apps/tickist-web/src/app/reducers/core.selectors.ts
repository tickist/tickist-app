import {createFeatureSelector, createSelector} from '@ngrx/store';
import {ProgressBarState} from '../core/reducers/progress-bar.reducer';
import {ApiErrorState} from '../core/reducers/detect-api-error.reducer';
import {AddTaskButtonVisibilityState} from '../core/reducers/add-task-button-visibility.reducer';
import {selectLoggedInUser} from '../core/selectors/user.selectors';



export const selectProgressBarState = createFeatureSelector<ProgressBarState>('progressBar');
export const selectApiErrorState = createFeatureSelector<ApiErrorState>('detectApiError');
export const selectAddTaskButtonVisibilityState = createFeatureSelector<AddTaskButtonVisibilityState>('addTaskButtonVisibility');


export const selectProgressBarIsEnabled = createSelector(
    selectProgressBarState,
    progressBar => progressBar.progressBar.isEnabled
);
export const selectApiErrorBarIsVisible = createSelector(
    selectApiErrorState,
    apiError => apiError.apiError.showApiErrorBar
);


export const selectAddTaskButtonVisibility = createSelector(
    selectAddTaskButtonVisibilityState,
    selectLoggedInUser,
    (addTaskButtonVisibility, user) => user && addTaskButtonVisibility.addTaskButtonVisibility.isVisible
);



