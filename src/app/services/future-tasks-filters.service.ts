import {Observable, pipe} from 'rxjs';
import {Injectable} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppStore} from '../store';
import {SimpleUser, User} from '../user/models';
import * as tasksAction from '../reducers/actions/tasks';
import {Router} from '@angular/router';
import {Filter} from '../models/filter';
import {UserService} from '../user/user.service';


@Injectable()
export class FutureTasksFiltersService {
    team: SimpleUser[];
    futureTasksFilters$: Observable<any>;
    currentFutureTasksFilters$: Observable<any>;
    filters: Filter[];
    user: User;

    constructor(private store: Store<AppStore>, protected router: Router,
                protected userService: UserService) {

        this.futureTasksFilters$ = this.store.pipe(
            select(s => s.futureTasksFilters)
        );
        this.currentFutureTasksFilters$ = this.store.pipe(
            select(s => s.currentTasksFutureFilters)
        );
        this.filters = [
            new Filter({
                'id': 1, 'label': 'filter', 'name': 'All',
                'value': task => task
            }),
            new Filter({
                'id': 2, 'label': 'filter', 'name': 'Only <i class="fa fa-arrow-right"></i>  &lt;date&gt; ',
                'value': task => task.typeFinishDate === 0
            }),
            new Filter({
                'id': 3, 'label': 'filter', 'name': 'Only <i class="fa fa-dot-circle-o"></i> &lt;date&gt;',
                'value': tag => tag.typeFinishDate === 1
            })
        ];
        this.userService.user$.subscribe(user => {
            this.user = user;
            this.loadCurrentFutureTasksFilters();
        });
        this.loadFutureTasksFilters();

    }

    loadCurrentFutureTasksFilters() {
        // const filter = this.filters.find(elem => elem.id === this.user.tagsFilterId);
        // @Todo fix it when the filter will be store in database
        this.store.dispatch(new tasksAction.AddCurrentFutureTasksFilters(this.filters[0]));
    }

    loadFutureTasksFilters() {
        this.store.dispatch(new tasksAction.AddFutureTasksFilters(this.filters));
    }

    updateCurrentFutureTasksFilter(currentFilter) {
        // @TODO fix it when the filter will be store in database
        // this.user.updateTagsFilterId(currentFilter);
        // this.userService.updateUser(this.user, false);
        this.store.dispatch(new tasksAction.UpdateCurrentFutureTasksFilters(currentFilter));
    }
}
