import {db} from '../init';
import { Notification } from '@data/notifications';

export async function createNotification(notificationObject: Notification) {
    const notification = await db.collection('notifications').doc();
    await notification.set({...notificationObject, id: notification.id})
}
