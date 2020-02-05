import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {QueryTags} from '../../../core/actions/tags.actions';
import {concatMap, map, switchMap, withLatestFrom} from 'rxjs/operators';
import {Update} from '@ngrx/entity';
import {addNotifications, markAllNotificationsAsRead, queryNotifications, updateNotification} from '../actions/notifications.actions';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';
import {Notification} from '@data/notifications';
import {selectAllUnreadNotificationsIds} from '../selectors/notifications.selectors';
import {NotificationsService} from '../services/notifications.service';
import {Store} from '@ngrx/store';


@Injectable()
export class NotificationsEffects {

    query$ = createEffect(() =>
        this.actions$
            .pipe(
                ofType<QueryTags>(queryNotifications),
                switchMap(() => {
                    return this.db.collection(
                        'notifications',
                        ref => ref.where('recipient', '==', this.authFire.auth.currentUser.uid).limit(30))
                        .stateChanges();
                }),
                concatMap(actions => {
                    const addedNotifications: Notification[] = [];
                    let deletedNotificationId: string;
                    let updatedNotification: Update<Notification>;
                    console.log(actions);
                    actions.forEach((action => {
                        if (action.type === 'added') {
                            const data: any = action.payload.doc.data();
                            addedNotifications.push(new Notification({
                                id: action.payload.doc.id,
                                ...data
                            }));
                        }
                        if (action.type === 'modified') {
                            const data: any = action.payload.doc.data();
                            updatedNotification = {
                                id: action.payload.doc.id,
                                changes: new Notification({...data})
                            };
                        }
                        if (action.type === 'removed') {
                            deletedNotificationId = action.payload.doc.id;
                        }
                    }));
                    const returnsActions = [];
                    if (addedNotifications.length > 0) {
                        returnsActions.push(addNotifications({notifications: addedNotifications}));
                    }
                    if (updatedNotification) {
                        returnsActions.push(updateNotification({notification: updatedNotification}));
                    }

                    return returnsActions;
                })
            ));

    markAllNotificationsAsRead$ = createEffect(() =>
        this.actions$.pipe(
            ofType(markAllNotificationsAsRead),
            withLatestFrom(this.store.select(selectAllUnreadNotificationsIds)),
            map(([, unreadNotificationsIds]) => {
                this.notificationsService.markAllAsRead(unreadNotificationsIds);
            })
        ), {dispatch: false}
    );

    markAs$ = createEffect(() =>
        this.actions$.pipe(
            ofType(updateNotification),
            map(action => {
                this.notificationsService.updateNotification(action.notification.changes);
            })
        ), {dispatch: false}
    );

    constructor(private actions$: Actions, private db: AngularFirestore, private authFire: AngularFireAuth, private store: Store<{}>,
                private notificationsService: NotificationsService) {
    }

}