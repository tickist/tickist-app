import * as functions from 'firebase-functions';
import {Notification} from '@data/notifications';
import {db, messaging} from '../init';

export const onCreateNotification = functions.firestore.document('notifications/{notificationId}')
    .onCreate(async (snap, context) => {
        const notificationData = snap.data() as Notification;
        const user = await db.collection('users').doc(notificationData.recipient).get();
        const userData = user.data();
        const payload = {
            notification: {
                title: notificationData.title,
                body: notificationData.description,
            }
        };
        if (userData.fcmToken) {
            await messaging.sendToDevice(userData.fcmToken, payload);
        }

    });
