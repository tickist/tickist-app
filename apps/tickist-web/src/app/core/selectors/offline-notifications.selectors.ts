import { createSelector } from "@ngrx/store";

export const selectOfflineNotificationsState = (state) => state.offlineModeNotification;

export const isOffline = createSelector(selectOfflineNotificationsState, (state) => state);
