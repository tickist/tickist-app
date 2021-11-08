import {Action, createReducer, on} from '@ngrx/store';
import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {Notification} from '@data/notifications';
import {addNotification, addNotifications, updateNotification, updateNotifications} from '../actions/notifications.actions';

export const notificationsFeatureKey = 'notifications';

export const adapter: EntityAdapter<Notification> = createEntityAdapter<Notification>();

export const initialState: NotificationState = adapter.getInitialState();


export type NotificationState = EntityState<Notification>


export const notificationReducer = createReducer(
    initialState,
    on(addNotifications, (state, {notifications}) => adapter.addMany(notifications, state)
    ),
    on(addNotification, (state, {notification}) => adapter.addOne(notification, state)),
    on(updateNotification, (state, {notification}) => adapter.updateOne(notification, state)),

    on(updateNotifications, (state, {notifications}) => adapter.updateMany(notifications, state))
);


export function reducer(state: NotificationState | undefined, action: Action) {
    return notificationReducer(state, action);
}

export const {
    selectAll,
    selectEntities,
    selectIds,
    selectTotal

} = adapter.getSelectors();
