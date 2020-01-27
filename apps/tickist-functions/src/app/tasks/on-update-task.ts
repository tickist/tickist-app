import * as functions from 'firebase-functions';
import {db} from '../init';
import {Task} from '@data/tasks/models/tasks';
import * as firebase from 'firebase';
import * as diff from 'recursive-diff';

export const onUpdateTask = functions.firestore.document('tasks/{taskId}')
    .onUpdate(async (change, context) => {
        console.log('Running onUpdateTask trigger ...');
        const before = change.before;
        const after = change.after;
        const beforeData = <Task>before.data();
        const afterData = <Task>after.data();

        const timeStamp = new Date().toISOString();
        const taskHistoryRef = change.after.ref.collection('history').doc(timeStamp);
        await taskHistoryRef.set({'beforeData': beforeData, 'diff': diff.getDiff(beforeData, afterData)});
    });


export const createUpdateNotification = functions.firestore.document('tasks/{taskId}')
    .onUpdate(async (change, context) => {
        console.log('Running onUpdateTask trigger ...');
        const before = change.before;
        const after = change.after;
        if (before.isEqual(after)) return;
        const beforeData = before.data() as Task;
        const afterData = after.data() as Task;

        if (beforeData.isDone === false && afterData.isDone === true) {

        }

        if (context.auth.uid === afterData.author.id && afterData.author.id !== afterData.owner.id) {

        } else if (context.auth.uid === afterData.owner.id && afterData.author.id !== afterData.owner.id) {

        } else if ((afterData.author.id !== afterData.owner.id) &&
            (afterData.owner.id !== context.auth.uid) &&
            (afterData.author.id !== context.auth.uid)) {

        }

    });

