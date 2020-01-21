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
