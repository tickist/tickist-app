import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType, concatLatestFrom } from "@ngrx/effects";
import { concatMap, map, switchMap, withLatestFrom } from "rxjs/operators";
import { Update } from "@ngrx/entity";
import {
    addNotifications,
    markAllNotificationsAsRead,
    queryNotifications,
    updateNotification,
    updateNotifications,
} from "../actions/notifications.actions";
import { Auth } from "@angular/fire/auth";
import { Notification } from "@data/notifications";
import { selectAllUnreadNotificationsIds } from "../selectors/notifications.selectors";
import { NotificationsService } from "../services/notifications.service";
import { Store } from "@ngrx/store";
import { selectLoggedInUser } from "../../../core/selectors/user.selectors";
import { collection, collectionChanges, Firestore, limit, orderBy, query, where } from "@angular/fire/firestore";

@Injectable()
export class NotificationsEffects {
    query$ = createEffect(() =>
        this.actions$.pipe(
            ofType(queryNotifications),
            withLatestFrom(this.store.select(selectLoggedInUser)),
            switchMap(([, user]) => {
                // collection(this.db, "notifications", (ref) =>
                //     ref
                //         .where("recipient", "==", user.id)
                //         .limit(30)
                //         .orderBy("date")
                // ).stateChanges();
                const firebaseCollection = collection(this.firestore, "notifications");
                const firebaseQuery = query(firebaseCollection, where("recipient", "==", user.id), limit(30), orderBy("date"));
                return collectionChanges(firebaseQuery);
            }),
            concatMap((actions) => {
                const addedNotifications: Notification[] = [];
                const updatedNotifications: Update<Notification>[] = [];
                actions.forEach((action) => {
                    if (action.type === "added") {
                        const data: any = action.doc.data();
                        addedNotifications.push(
                            new Notification({
                                id: action.doc.id,
                                ...data,
                            })
                        );
                    }
                    if (action.type === "modified") {
                        const data: any = action.doc.data();
                        updatedNotifications.push({
                            id: action.doc.id,
                            changes: new Notification({ ...data }),
                        });
                    }
                });
                const returnsActions = [];
                if (addedNotifications.length > 0) {
                    returnsActions.push(addNotifications({ notifications: addedNotifications }));
                }
                if (updatedNotifications.length > 0) {
                    returnsActions.push(
                        updateNotifications({
                            notifications: updatedNotifications,
                        })
                    );
                }

                return returnsActions;
            })
        )
    );

    markAllNotificationsAsRead$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(markAllNotificationsAsRead),
                concatLatestFrom(() => this.store.select(selectAllUnreadNotificationsIds)),
                map(([, unreadNotificationsIds]) => {
                    this.notificationsService.markAllAsRead(unreadNotificationsIds);
                })
            ),
        { dispatch: false }
    );

    markAs$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(updateNotification),
                map((action) => {
                    this.notificationsService.updateNotification(action.notification.changes);
                })
            ),
        { dispatch: false }
    );

    constructor(
        private actions$: Actions,
        private firestore: Firestore,
        private authFire: Auth,
        private store: Store,
        private notificationsService: NotificationsService
    ) {}
}
