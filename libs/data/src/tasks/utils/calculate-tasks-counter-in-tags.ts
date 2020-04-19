import {TagWithTaskCounter} from '@data';


export function calculateTasksCounterInTags(tags, tasks): TagWithTaskCounter[] {

    return tags.map(tag => {
        const tasksCounter = tasks.filter(task => {
            const tagIds = task.tags.map(t => t.id);

            return tagIds.includes(tag.id);
        }).length;
        return new TagWithTaskCounter({
            ...tag,
            tasksCounter: tasksCounter,
        });
    });
}
