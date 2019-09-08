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
        const beforeData = <Project>before.data();
        const afterData = <Project>after.data();
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
                    task.ref.update({taskProject: JSON.parse(JSON.stringify(newTaskProject))});
                }
            );
        }
        if (beforeData.isActive === true && afterData.isActive === false) {
            const tasks = await db.collection('tasks').where('taskProject.id', '==', projectId).get();
            const query = tasks.docs;
            for (const task of query) {
                if (task.data().owner.id === beforeData.owner) {
                    await task.ref.update({
                        'isActive': false
                    });
                } else {
                    const owner = await db.collection('users').doc(task.data().owner.id).get();
                    const inbox = await db.collection('projects').doc(owner.data().inboxPk).get();
                    const inboxData = inbox.data();
                    console.log({task});
                    console.log({owner});
                    console.log({inbox});
                    console.log({inboxData});
                    const taskProject = new TaskProject(
                        {
                            id: inbox.id,
                            name: inboxData.name,
                            color: inboxData.color,
                            shareWithIds: inboxData.shareWithIds
                        });
                    await task.ref.update({
                        'taskProject': JSON.parse(JSON.stringify(taskProject))
                    });
                }
            }
        }
    });
