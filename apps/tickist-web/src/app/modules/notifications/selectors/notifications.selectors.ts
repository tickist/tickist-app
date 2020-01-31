import {createFeatureSelector, createSelector} from '@ngrx/store';
import {notificationsFeatureKey, NotificationState, selectAll} from '../reducers/notifications.reducer';

export const selectNotificationsState = createFeatureSelector<NotificationState>(notificationsFeatureKey);

export const selectAllNotifications = createSelector(
    selectNotificationsState,
    selectAll
);

export const selectLengthOfAllUnreadNotifications = createSelector(
    selectAllNotifications,
    (notifications) => {
        return notifications.filter(notification => !notification.isRead).length
    }
);
