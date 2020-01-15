import {createSelector} from '@ngrx/store';
import {selectLeftSidenavVisibilityState} from './sidenav-visibility.selectors';

export const selectOfflineNotificationsState = state => state.offlineModeNotification;

export const isOffline = createSelector(
    selectOfflineNotificationsState,
    state => state
);
