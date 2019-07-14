import {Injectable} from '@angular/core';
import {SimpleUser, User} from '../../core/models';
import {Filter} from '../../models/filter';


@Injectable()
export class FutureTasksFiltersService {
    team: SimpleUser[];
    filters: Filter[];
    user: User;

    static getAllFutureTasksFilters () {
        return [
            new Filter({
                'id': 1, 'label': 'filter', 'name': 'All',
                'value': `task => task`, 'icon': ''
            }),
            new Filter({
                'id': 2, 'label': 'filter', 'name': 'Only <i class="fa fa-arrow-right"></i>  &lt;date&gt; ',
                'value': `task => task.typeFinishDate === 0`, icon: 'arrow-right'
            }),
            new Filter({
                'id': 3, 'label': 'filter', 'name': 'Only <i class="fa fa-dot-circle-o"></i> &lt;date&gt;',
                'value': `tag => tag.typeFinishDate === 1`, icon: 'dot-circle'
            })
        ];
    }

    static getDefaultCurrentTagsFilter(filterId) {
        const filters = FutureTasksFiltersService.getAllFutureTasksFilters();
        return filters.find(filter => filter.id === filterId);
    }

    constructor() {
    }

    loadCurrentFutureTasksFilters() {
        // const filter = this.filters.find(elem => elem.id === this.user.tagsFilterId);
        // @Todo fix it when the filter will be store in database
        // this.store.dispatch(new tasksAction.AddCurrentFutureTasksFilters(this.filters[0]));
    }

    loadFutureTasksFilters() {
        // this.store.dispatch(new tasksAction.AddFutureTasksFilters(this.filters));
    }

    updateCurrentFutureTasksFilter(currentFilter) {
        // // @TODO fix it when the filter will be store in database
        // // this.user.updateTagsFilterId(currentFilter);
        // // this.userService.updateUser(this.user, false);
        // this.store.dispatch(new tasksAction.UpdateCurrentFutureTasksFilters(currentFilter));
    }
}
