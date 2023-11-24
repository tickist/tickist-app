import { createSelector } from "@ngrx/store";

export const selectUIState = (state) => state.ui;

export const addTaskInputIsFocus = createSelector(selectUIState, (uiState) => uiState.addTask.focus);

export const searchInputIsFocus = createSelector(selectUIState, (uiState) => uiState.searchInput.focus);
