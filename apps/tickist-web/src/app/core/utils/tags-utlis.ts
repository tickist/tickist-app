import {TagWithTaskCounter} from '../../../../../../libs/data/src/tags/models/tag-with-task-counter';


export function calculateTasksCounterInTags(tags, tasks): TagWithTaskCounter[] {

    return tags.map(tag => {
        const tasksCounter = tasks.filter(task => {
            const tagIds = task.tags.map(t => t.id);

            return tagIds.includes(tag.id);
        }).length;
        return new TagWithTaskCounter({
            name: tag.name,
            id: tag.id,
            author: tag.author,
            tasksCounter: tasksCounter,
        });
    });
}
