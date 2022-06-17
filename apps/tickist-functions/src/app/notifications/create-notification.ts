import { db } from "../init";
import { Notification } from "@data";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const admin = require("firebase-admin");

export async function createNotification(notificationObject: Notification) {
    const notification = await db.collection("notifications").doc();
    await notification.set({
        ...notificationObject,
        id: notification.id,
        date: admin.firestore.Timestamp.fromDate(new Date()),
    });
}
