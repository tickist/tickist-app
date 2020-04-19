import {Tag} from '@data';

export function removeTagsNotBelongingToUser(tags: Tag[], userId: string): Tag[] {
    return tags.filter(tag => tag.author === userId)
}
