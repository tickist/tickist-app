import * as functions from 'firebase-functions';

export const onCreateUser= functions.firestore.document('users/{userId}/')
    .onCreate(async (snap,context) => {

        console.log("Running onCreateUser trigger ...");

        return null

    });
