import * as functions from 'firebase-functions';
import {Project} from '@data/projects';
import {db} from '../init';
import {TaskProject} from '@data/tasks/models/task-project';

export const onUpdateProject = functions.firestore.document('projects/{projectId}').onUpdate(
    async (change, context) => {
        const before = change.before;
        const after = change.after;
        const projectId = change.before.id;
        console.log('This is before: ', before, change.before);
        console.log('This is after: ', after, change.after);
        const beforeData = <Project> before.data();
        const afterData = <Project> after.data();
        if (beforeData.name !== afterData.name
            || beforeData.color !== afterData.color
            || beforeData.shareWith !== afterData.shareWith
            || beforeData.shareWithIds !== beforeData.shareWithIds) {
                const newTaskProject = new TaskProject(
                    {'id': afterData.id, color: afterData.color, name: afterData.name, shareWithIds: afterData.shareWithIds}
                    );
                const tasks = await db.collection('tasks').where('taskProject.id', '==', projectId).get();
                tasks.forEach(
                    task => {
                            task.ref.update({taskProject: JSON.parse(JSON.stringify(newTaskProject))})
                    }
                );
        }
    });
