import * as functions from 'firebase-functions';
import {Project} from '@data/projects';

export const onUpdateProject = functions.firestore.document('projects/{projectId}').onUpdate(
    (change, context) => {
        const before = change.before;
        const after = change.after;
        console.log('This is after: ', after, change.after)
        const beforeData = <Project> before.data();
        const afterData = <Project> after.data();
        if (beforeData.name !== afterData.name
            || beforeData.color !== afterData.color
            || beforeData.shareWith !== afterData.shareWith
            || beforeData.shareWithIds !== beforeData.shareWithIds) {
        }

    });
