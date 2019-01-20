import {createSelector} from '@ngrx/store';



export const selectProgressBarState = state => state.progressBar;

export const selectProgressBarIsEnabled = createSelector(
    selectProgressBarState,
    progressBar => progressBar.isEnabled
);
