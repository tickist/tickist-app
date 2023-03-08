import { db } from "../init";
import { Notification } from "@data";
import * as admin from "firebase-admin";

export async function createNotification(notificationObject: Notification) {
    const notification = await db.collection("notifications").doc();
    await notification.set({
        ...notificationObject,
        id: notification.id,
        date: admin.firestore.Timestamp.fromDate(new Date()),
    });
}
