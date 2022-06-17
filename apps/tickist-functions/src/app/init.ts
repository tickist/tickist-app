// eslint-disable-next-line @typescript-eslint/no-var-requires
const admin = require("firebase-admin");

admin.initializeApp();

export const db = admin.firestore();
export const messaging = admin.messaging();
