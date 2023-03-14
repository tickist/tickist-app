// eslint-disable-next-line @typescript-eslint/no-var-requires
const admin = require("firebase-admin");

try {
    admin.initializeApp();
} catch (err) {
    admin.app();
}

export const db = admin.firestore();
export const messaging = admin.messaging();
