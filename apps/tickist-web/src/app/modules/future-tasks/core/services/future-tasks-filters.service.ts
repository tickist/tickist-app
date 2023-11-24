import { Injectable } from "@angular/core";
import { SimpleUser, User } from "@data/users/models";
import { Filter } from "@data/filter";

@Injectable()
export class FutureTasksFiltersService {
    team: SimpleUser[];
    filters: Filter[];
    user: User;

    static getAllFutureTasksFilters() {
        return [
            new Filter({
                id: 1,
                label: "filter",
                name: "all",
                value: `task => task`,
                icon: "",
            }),
            new Filter({
                id: 2,
                label: "filter",
                name: "statusBy",
                value: `task => task.typeFinishDate === 0`,
                icon: "arrow-right",
            }),
            new Filter({
                id: 3,
                label: "filter",
                name: "statusOn",
                value: `tag => tag.typeFinishDate === 1`,
                icon: "dot-circle",
            }),
        ];
    }

    static getDefaultCurrentTagsFilter(filterId) {
        const filters = FutureTasksFiltersService.getAllFutureTasksFilters();
        return filters.find((filter) => filter.id === filterId);
    }

    loadCurrentFutureTasksFilters() {
        // const filter = this.filters.find(elem => elem.id === this.user.tagsFilterId);
        // @Todo fix it when the filter will be store in database
        // this.store.dispatch(new tasksAction.AddCurrentFutureTasksFilters(this.filters[0]));
    }

    loadFutureTasksFilters() {
        // this.store.dispatch(new tasksAction.AddFutureTasksFilters(this.filters));
    }

    updateCurrentFutureTasksFilter() {
        // // @TODO fix it when the filter will be store in database
        // // this.user.updateTagsFilterId(currentFilter);
        // // this.userService.updateUser(this.user, false);
        // this.store.dispatch(new tasksAction.UpdateCurrentFutureTasksFilters(currentFilter));
    }
}
