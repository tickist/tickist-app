import * as functions from 'firebase-functions';
import {db} from '../init';

export const onDeleteTag = functions.firestore.document('tags/{tagId}')
    .onDelete(async (change, context) => {
        console.log('Running onDeleteTag trigger ...');

        return db.runTransaction(async transaction => {
            const tasks = await db.collection('tasks').where('tagsIds', 'array-contains', change.id).get();
            tasks.forEach(
                task => {
                    const tags = task.data().tags;
                    const tagsIds = task.data().tagsIds;
                    transaction.update(task.ref, {
                        'tags': tags.filter(tag => tag.id !== change.id),
                        'tagsIds': tagsIds.filter(tagId => tagId !== change.id)
                    });
                }
            );

        });
    });
