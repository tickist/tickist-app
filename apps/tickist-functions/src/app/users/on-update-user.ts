
import * as functions from 'firebase-functions';
import {db} from '../init';


export const onUpdateUser = functions.firestore.document('users/{userId}')
        .onUpdate(async (snap, context) => {

            console.log('Running onUpdateUser trigger ...');
            // @TODO need to add the body
            return db.runTransaction(async transaction => {

            });

        });


// function courseTransaction(snap, cb:Function) {
//     return db.runTransaction(async transaction => {
//
//         const courseRef = snap.ref.parent.parent;
//
//         const courseSnap = await transaction.get(courseRef);
//
//         const course = courseSnap.data();
//
//         const changes = cb(course);
//
//         transaction.update(courseRef, changes);
//
//     });
//
// }
