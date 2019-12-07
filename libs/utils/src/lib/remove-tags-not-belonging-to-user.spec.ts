import {removeTagsNotBelongingToUser} from './remove-tags-not-belonging-to-user';
import {Tag} from '@data/tags/models/tags';

describe('removeTagsNotBelongingToUser', () => {
    let tags: Partial<Tag>[];
    let userId: string;

    beforeEach(() => {
        tags = [
            {id: '1', author: '1', name: 'Tag 1'},
            {id: '2', author: '1', name: 'Tag 2'},
            {id: '3', author: '1', name: 'Tag 3'},
            {id: '4', author: '1', name: 'Tag 4'},
            {id: '5', author: '11', name: 'Tag 5'}
        ];
        userId = '1';
    });

    it('should remove tags not belonging to the user', () => {
        expect(removeTagsNotBelongingToUser(<Tag[]> tags, userId)).toEqual(tags.filter((tag) => tag.author === userId));
    });
});
