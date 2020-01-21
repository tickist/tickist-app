import * as functions from 'firebase-functions';
import {db} from '../init';
import {Tag} from '@data/tags/models/tags';
import * as firebase from 'firebase';
import * as diff from 'recursive-diff';

export const onUpdateTag = functions.firestore.document('tags/{tagId}')
    .onUpdate(async (change, context) => {
        console.log('Running onUpdateTag trigger ...');
        const before = change.before;
        const after = change.after;
        const beforeData = <Tag>before.data();
        const afterData = <Tag>after.data();

        const beforeTag = new Tag({
            id: beforeData.id,
            author: beforeData.author,
            creationDate: beforeData.creationDate,
            name: beforeData.name
        });
        const afterTag = new Tag({
            id: afterData.id,
            author: afterData.author,
            creationDate: afterData.creationDate,
            name: afterData.name
        });
        const timeStamp = new Date().toISOString();
        const tagHistoryRef = change.after.ref.collection('history').doc(timeStamp);
        await tagHistoryRef.set({'beforeData': beforeData, 'diff': diff.getDiff(beforeData, afterData)});

        return db.runTransaction(async transaction => {
            if (beforeData.name !== afterData.name) {
                const tasks = await db.collection('tasks').where('tagsIds', 'array-contains', beforeTag.id).get();
                tasks.forEach(
                    task => {
                        const tags = task.data().tags;
                        transaction.update(task.ref, {
                            'tags': tags.map(tag => {
                                if (tag.id === beforeTag.id) {
                                    return Object.assign({}, tag, {name: afterTag.name});
                                }
                                return tag;
                            })
                        });
                    }
                );
            }
        });
    });
