import {createFeatureSelector, createSelector} from '@ngrx/store';
import {ProgressBarState} from '../core/reducers/progress-bar.reducer';
import {ApiErrorState} from '../core/reducers/detect-api-error.reducer';
import {OfflineModeBarState} from '../core/reducers/offline-mode.reducer';



export const selectProgressBarState = createFeatureSelector<ProgressBarState>('progressBar');
export const selectApiErrorrState = createFeatureSelector<ApiErrorState>('detectApiError');
export const selectOfflineModedeState = createFeatureSelector<OfflineModeBarState>('offlineMode');


export const selectProgressBarIsEnabled = createSelector(
    selectProgressBarState,
    progressBar => progressBar.progressBar.isEnabled
);
export const selectApiErrorBarIsVisible = createSelector(
    selectApiErrorrState,
    apiError => apiError.apiError.showApiErrorBar
);
export const selectOfflineModeBarIsVisible = createSelector(
    selectOfflineModedeState,
    offlineMode => offlineMode.offlineModeBar.isEnabled
);

