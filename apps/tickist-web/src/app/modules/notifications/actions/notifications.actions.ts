import {createAction, props} from '@ngrx/store';
import {Update} from '@ngrx/entity';
import {Notification} from '@data/notifications';

export const queryNotifications = createAction('[Notifications] Notifications query');

export const addNotifications = createAction(
    '[Notifications] Add notifications',
    props<{notifications: Notification[]}>()
);

export const addNotification = createAction(
    '[Notifications] Add notification',
    props<{notification: Notification}>()
);

export const updateNotification = createAction(
    '[Notifications] Update notification',
    props<{notification: Update<Notification>}>()
);

export const notificationIsRead = createAction('[Notifications] Notification is read');

export const allNotificationsAreRead = createAction('[Notifications] All notifications are read');
