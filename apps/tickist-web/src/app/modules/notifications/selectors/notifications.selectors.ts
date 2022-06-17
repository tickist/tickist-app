import { createFeatureSelector, createSelector } from "@ngrx/store";
import { notificationsFeatureKey, NotificationState, selectAll } from "../reducers/notifications.reducer";
import { Notification } from "@data";
import { orderBy } from "lodash";

export const selectNotificationsState = createFeatureSelector<NotificationState>(notificationsFeatureKey);

export const selectAllNotifications = createSelector(selectNotificationsState, selectAll);

export const selectAllUnreadNotifications = createSelector(selectAllNotifications, (notifications): Notification[] =>
    notifications.filter((notification) => !notification.isRead)
);

export const selectAllNotificationsWithOrder = createSelector(selectAllNotifications, (notifications): Notification[] =>
    orderBy(notifications, ["date"], ["desc"])
);

export const selectAllUnreadNotificationsIds = createSelector(selectAllUnreadNotifications, (notifications): string[] =>
    notifications.map((notification) => notification.id)
);

export const selectLengthOfAllUnreadNotifications = createSelector(
    selectAllNotifications,
    (notifications) => notifications.filter((notification) => !notification.isRead).length
);

export const selectLengthOfAllNotifications = createSelector(selectAllNotifications, (notifications) => notifications.length);
