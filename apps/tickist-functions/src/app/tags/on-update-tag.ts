import * as functions from 'firebase-functions';
import {db} from '../init';

export const onUpdateTag = functions.firestore.document('tags/{tagId}/')
    .onUpdate(async (snap, context) => {

        console.log('Running onUpdateTag trigger ...');

        return db.runTransaction(async transaction => {

        });

    });
