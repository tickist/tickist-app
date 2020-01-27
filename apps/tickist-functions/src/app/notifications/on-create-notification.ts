import * as functions from 'firebase-functions';
import {Notification} from '@data/notifications';

export const onCreateNotification = functions.firestore.document('notifications/{notificationId}')
    .onCreate(async (snap, context) => {
        const notificationData = snap.data() as Notification;

    });
