import * as functions from 'firebase-functions';
import {db} from '../init';
import {TaskUser} from '@data/tasks/models/task-user';
import * as diff from 'recursive-diff';

export const onUpdateUser = functions.firestore.document('users/{userId}')
    .onUpdate(async (change, context) => {
        console.log('Running onUpdateUser trigger ...');
        const before = change.before.data();
        const after = change.after.data();
        const userId = change.before.id;

        const timeStamp = new Date().toISOString();
        const userHistoryRef = change.after.ref.collection('history').doc(timeStamp);
        const diffObject = diff.getDiff(before, after);
        // JSON remove undefinedValues from diff object
        await userHistoryRef.set({'beforeData': before, 'diff': JSON.parse(JSON.stringify(diffObject))});

        console.log('Change user avatar');
        if (before.avatarUrl !== after.avatarUrl || before.username !== after.username) {
            const ownerTasks = await db.collection('tasks')
                .where('taskProject.shareWithIds', 'array-contains', userId)
                .where('isActive', '==', true)
                .where('isDone', '==', false)
                .where('owner.id', '==', userId)
                .get();

            ownerTasks.forEach(task => {
                const taskData = task.data();
                const owner = new TaskUser(
                    {
                        id: taskData.owner.id,
                        username: after.username,
                        email: taskData.owner.email,
                        avatarUrl: after.avatarUrl
                    });
                task.ref.update({
                    'owner': JSON.parse(JSON.stringify(owner))
                });
            });

            const authorTasks = await db.collection('tasks')
                .where('taskProject.shareWithIds', 'array-contains', userId)
                .where('isActive', '==', true)
                .where('isDone', '==', false)
                .where('author.id', '==', userId)
                .get();
            const authorTasksQuery = authorTasks.docs;

            authorTasks.forEach(task => {
                const taskData = task.data();
                const author = new TaskUser (
                    {
                        id: taskData.author.id,
                        username: after.username,
                        email: taskData.author.email,
                        avatarUrl: after.avatarUrl
                    });
                task.ref.update({
                    'author': JSON.parse(JSON.stringify(author))
                });
            });

            const projects = await db.collection('projects')
                .where('shareWithIds', 'array-contains', userId)
                .where('isActive', '==', true)
                .get();

            projects.forEach(project => {
                const projectData = project.data();
                const newShareWith = projectData.shareWith.map(user => {
                    if (user.id !== userId) return user;
                    return {
                        ...user,
                        username: after.username,
                        avatarUrl: after.avatarUrl
                    }
                });
                project.ref.update({
                    'shareWith': JSON.parse(JSON.stringify(newShareWith))
                });
            });
        }
    });
