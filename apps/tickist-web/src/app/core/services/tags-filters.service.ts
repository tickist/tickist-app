import {Injectable} from '@angular/core';
import {User} from '@data/users/models';
import {Filter} from '@data/filter';


@Injectable({
    providedIn: 'root',
})
export class TagsFiltersService {
    filters: Filter[];
    user: User;

    static getAllTagsFilter () {
       return [
            new Filter({
                'id': 1, 'label': 'filter', 'name': 'All tags',
                'value': `tag => tag`
            }),
            new Filter({
                'id': 2, 'label': 'filter', 'name': 'Tags with tasks',
                'value': `tag => tag.tasksCounter > 0`
            }),
            new Filter({
                'id': 3, 'label': 'filter', 'name': 'Tags without tasks',
                'value': `tag => tag.tasksCounter === 0`
            })
        ];
    }

    static getDefaultCurrentTagsFilter(filterId) {
        const filters = TagsFiltersService.getAllTagsFilter();
        return filters.find(filter => filter.id === filterId);
    }


    constructor() {
    }

}
