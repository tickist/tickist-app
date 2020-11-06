import {createSelector} from '@ngrx/store';
import {UIState} from "../reducers/ui.reducer";


export const selectUIState = state => state.ui;

export const addTaskInputIsFocus = createSelector(
    selectUIState,
    (uiState: UIState) => uiState.addTask.focus
);

export const searchInputIsFocus = createSelector(
    selectUIState,
    (uiState: UIState) => uiState.searchInput.focus
);
