import {Tag} from '@data/tags/models/tags';
import {user} from 'firebase-functions/lib/providers/auth';

export function removeTagsNotBelongingToUser(tags: Tag[], userId: string): Tag[] {
    return tags.filter(tag => tag.author === userId)
}
