import * as functions from 'firebase-functions';
import {InviteUser, InviteUserStatus, Project, ShareWithUser} from '@data/projects';
import {db} from '../init';
import {TaskProject} from '@data/tasks/models/task-project';

export const onUpdateProject = functions.firestore.document('projects/{projectId}').onUpdate(
    async (change, context) => {
        const before = change.before;
        const after = change.after;
        const projectId = change.before.id;
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
        const beforeDataInviteUserByEmail = beforeData.hasOwnProperty('inviteUserByEmail') ? beforeData.inviteUserByEmail.length : 0;
        if (beforeDataInviteUserByEmail < afterData.inviteUserByEmail.length) {
            const inviteUserByEmail = afterData.inviteUserByEmail;
            let newInviteUserByEmail: Array<InviteUser> = [];
            const newShareWith: ShareWithUser[] = afterData.shareWith;
            const newShareWithIds: string[] = afterData.shareWithIds;
            for (const entry of inviteUserByEmail) {
                const email = entry.email;
                const userQuery = await db.collection('users')
                    .where('email', '==', email)
                    .limit(1)
                    .get();
                const [user,] = userQuery.docs;
                if (user && !beforeData.shareWithIds.includes(user.id)) {
                    const userData = user.data();

                    newShareWith.push(
                        JSON.parse(
                            JSON.stringify(
                                new ShareWithUser({
                                    id: userData.id,
                                    username: userData.username,
                                    email: userData.email,
                                    avatarUrl: userData.avatarUrl,
                                })
                            )
                        )
                    );
                    newShareWithIds.push(userData.id);
                } else {
                    const index = newInviteUserByEmail.findIndex(invitedUser => invitedUser.email === email);
                    if (index === -1) {
                        newInviteUserByEmail.push({email: email, status: InviteUserStatus.Error});
                    } else {
                        newInviteUserByEmail = newInviteUserByEmail.map(invitedUser => {
                            if (invitedUser.email === email) {
                                return {
                                    ...invitedUser,
                                    status: InviteUserStatus.Error
                                }
                            }
                            return invitedUser;
                        })
                    }
                }



            }


           return after.ref.update({
                shareWith: newShareWith,
                shareWithIds: newShareWithIds,
                inviteUserByEmail: newInviteUserByEmail
            });
        }
    });
