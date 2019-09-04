import * as functions from 'firebase-functions';
import {db} from '../init';
import * as admin from 'firebase-admin';
import {Project, ShareWithUser} from '@data/projects';
import {Tag} from '@data/tags/models/tags';
import {Task} from '@data/tasks/models/tasks';


export const onCreateUser = functions.firestore.document('users/{userId}')
    .onCreate(async (snap, context) => {
        const userId = context.params.userId;
        console.log('Running createUser trigger ...');

        return db.runTransaction(async transaction => {
            console.log('here');
            const tags: { [key: string]: Tag } = {};
            const projectRef = db.collection('projects').doc();
            console.log(projectRef.id);
            const inbox = createInboxProject(snap.data(), userId);
            transaction.set(projectRef, JSON.parse(JSON.stringify({id: projectRef.id, ...inbox})));
            defaultTagsName().forEach(tagName => {
                const tagRef = db.collection('tags').doc();
                console.log({tagRef});
                transaction.set(tagRef, JSON.parse(JSON.stringify(createTag(tagName, userId))));
                tags[tagName] = new Tag({id: tagRef.id, name: tagName, author: userId});
            });

            transaction.update(snap.ref, {inboxPk: projectRef.id});
            transaction.set(
                db.collection('tags').doc(),
                JSON.parse(JSON.stringify(createTask('Find out more about Tickist', snap.data(), inbox, [
                    tags['quick tasks'],
                    tags['getting to know Tickist']])))
            );

            transaction.set(
                db.collection('tags').doc(),
                JSON.parse(JSON.stringify(createTask('Find out more about editing tasks', snap.data(), inbox, [
                    tags['work'],
                    tags['home'],
                    tags['need focus'],
                    tags['someday/maybe'],
                    tags['tasks for later']])))
            );
        });

    });


function createInboxProject(userData, userId): Project {
    return new Project({
        name: 'Inbox', isInbox: true, owner: userId,
        shareWith: [<ShareWithUser>{id: userId, username: userData.username, email: userData.email, avatarUrl: userData.avatarUrl}],
        shareWithIds: [userId]
    });
}

function createTag(tagName, userId): Tag {
    return new Tag({name: tagName, author: userId});
}

function defaultTagsName() {
    return [
        'work', 'home', 'need focus', 'someday/maybe', 'tasks for later', 'quick tasks', 'getting to know Tickist'
    ];
}

function createTask(name, user, project, tags) {
    return new Task({
        name: name,
        owner: user,
        ownerPk: user.id,
        priority: project.defaultPriority,
        author: user,
        taskListPk: project.id,
        tags: tags,
        tagsIds: tags.map(tag => tag.id),
        estimateTime: 5,
        finishDate: new Date().toISOString(),
        taskProject: {'id': project.id, name: project.name, color: project.color, shareWithIds: project.shareWithIds}
    });
}
