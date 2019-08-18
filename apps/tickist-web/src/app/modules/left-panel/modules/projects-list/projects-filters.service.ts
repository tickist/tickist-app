import {Injectable} from '@angular/core';
import {User} from '../../../../../../../../libs/data/src/users/models';
import {Filter} from '@tickist/data/filter';


@Injectable()
export class ProjectsFiltersService {
    filters: Filter[];
    user: User;

    static getAllProjectsFilters() {
        return [
            new Filter({
                'id': 1, 'label': 'filter', 'name': 'All projects',
                'value': `project => project`
            }),
            new Filter({
                'id': 2, 'label': 'filter', 'name': 'Projects with tasks',
                'value': `project => project.tasksCounter > 0`
            }),
            new Filter({
                'id': 3, 'label': 'filter', 'name': 'Projects without tasks',
                'value': `project => project.tasksCounter === 0`
            })
        ];
    }

    static getDefaultCurrentProjectsFilter(filterId) {
        const filters = ProjectsFiltersService.getAllProjectsFilters();
        return filters.find(filter => filter.id === filterId);
    }

    constructor() {

    }
}
