import {Action, createReducer, on} from '@ngrx/store';
import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {Notification} from '@data/notifications';
import {addNotification, addNotifications, updateNotification} from '../actions/notifications.actions';

export const notificationsFeatureKey = 'notifications';

export const adapter: EntityAdapter<Notification> = createEntityAdapter<Notification>();

export const initialState: NotificationState = adapter.getInitialState();


export interface NotificationState extends EntityState<Notification> {
}


export const notificationReducer = createReducer(
    initialState,
    on(addNotifications, (state, {notifications}) => {
            return adapter.addMany(notifications, state);
        }
    ),
    on(addNotification, (state, {notification}) => {
        return adapter.addOne(notification, state);
    }),
    on(updateNotification, (state, {notification}) => {
      return adapter.updateOne(notification, state)
    })
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
