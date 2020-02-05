import {Injectable} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {Store} from '@ngrx/store';

@Injectable({
    providedIn: 'root'
})
export class NotificationsService {
    collectionPath = 'notifications';
    constructor(private db: AngularFirestore, private store: Store<{}>) {
    }

    markAllAsRead(notificationsIds: string[]): void {
        this.db.firestore.runTransaction(async (transaction) => {
            for (const notificationId of notificationsIds) {
                const notificationRef = await this.db.collection(this.collectionPath).doc(notificationId).ref;
                transaction.set(notificationRef, {isRead: true}, {merge:true});
            };

            return transaction;
        })
    }

    updateNotification(notification) {
        this.db.collection(this.collectionPath).doc(notification.id).update({...notification})
    }
}
