import { Injectable, Injector } from "@angular/core";
import { Store } from "@ngrx/store";
import { savefcmToken } from "../../../core/actions/user.actions";
import { getToken, isSupported, Messaging } from "@angular/fire/messaging";
import { doc, Firestore, runTransaction, updateDoc } from "@angular/fire/firestore";
import { EMPTY, Observable } from "rxjs";

@Injectable({
    providedIn: "root",
})
export class NotificationsService {
    collectionPath = "notifications";
    token$: Observable<any> = EMPTY;
    messaging: Messaging;
    constructor(
        private firestore: Firestore,
        private injector: Injector,
        private store: Store // private afMessaging: Messaging
    ) {
        isSupported().then(() => {
            this.messaging = this.injector.get(Messaging);
        });
    }

    async markAllAsRead(notificationsIds: string[]) {
        try {
            await runTransaction(this.firestore, async (transaction) => {
                for (const notificationId of notificationsIds) {
                    const docRef = doc(this.firestore, `${this.collectionPath}/${notificationId}`);
                    transaction.update(docRef, { isRead: true });
                }
            });
        } catch (e) {
            // This will be a "population is too big" error.
            console.error(e);
        }
    }

    async updateNotification(notification) {
        const docRef = doc(this.firestore, `${this.collectionPath}/${notification.id}`);
        await updateDoc(docRef, { ...notification });
    }

    async createFcmToken() {
        const token = await getToken(this.messaging);
        if (token) {
            this.store.dispatch(savefcmToken({ token }));
        } else {
            console.log("No registration token available. Request permission to generate one.");
        }
        // this.messenging.requestPermission
        //     .pipe(mergeMapTo(this.messenging.tokenChanges))
        //     .subscribe(
        //         (tokenChangesn) => {
        //             this.store.dispatch(savefcmToken({ token }));
        //         },
        //         (error) => {
        //             console.error(error);
        //         }
        //     );
    }
}
