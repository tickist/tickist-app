const admin = require('firebase-admin');

admin.initializeApp();
console.log({admin})
export const db = admin.firestore();
