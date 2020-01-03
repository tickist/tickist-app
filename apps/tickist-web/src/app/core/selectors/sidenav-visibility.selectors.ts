import {createSelector} from '@ngrx/store';

export const selectLeftSidenavVisibilityState = state => state.leftSidenavVisibility;

export const isLeftSideNavVisible = createSelector(
    selectLeftSidenavVisibilityState,
    state => state
);
