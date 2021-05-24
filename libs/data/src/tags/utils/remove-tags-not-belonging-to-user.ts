import {Tag} from '../models/tags';

export function removeTagsNotBelongingToUser(tags: Tag[], userId: string): Tag[] {
    return tags.filter(tag => tag.author === userId)
}
