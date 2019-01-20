import {Observable, pipe} from 'rxjs';
import {Injectable} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppStore} from '../store';
import {SimpleUser, User} from '../user/models';
import {MatSnackBar} from '@angular/material';
import * as tagsAction from '../reducers/actions/tags';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {Filter} from '../models/filter';
import {UserService} from '../user/user.service';
import {UpdateUser} from '../user/user.actions';


@Injectable()
export class TagsFiltersService {
    team: SimpleUser[];
    tagsFilters$: Observable<any>;
    currentTagsFilters$: Observable<any>;
    filters: Filter[];
    user: User;

    constructor(private store: Store<AppStore>, protected router: Router,
                protected userService: UserService) {

        this.tagsFilters$ = this.store.pipe(
            select(s => s.tagsFilters)
        );
        this.currentTagsFilters$ = this.store.pipe(
            select(s => s.currentTagsFilters)
        );
        this.filters = [
            new Filter({
                'id': 1, 'label': 'filter', 'name': 'All tags',
                'value': tag => tag
            }),
            new Filter({
                'id': 2, 'label': 'filter', 'name': 'Tags with tasks',
                'value': tag => tag.tasksCounter > 0
            }),
            new Filter({
                'id': 3, 'label': 'filter', 'name': 'Tags without tasks',
                'value': tag => tag.tasksCounter === 0
            })
        ];
        this.userService.user$.subscribe(user => {
            this.user = user;
            this.loadCurrentTagsFilters();
        });
        this.loadTagsFilters();

    }

    loadCurrentTagsFilters() {
        const filter = this.filters.find(elem => elem.id === this.user.tagsFilterId);
        this.store.dispatch(new tagsAction.AddCurrentFilters(filter));
    }

    loadTagsFilters() {
        this.store.dispatch(new tagsAction.AddFilters(this.filters));
    }

    updateCurrentFilter(currentFilter) {
        this.user.updateTagsFilterId(currentFilter);
        this.store.dispatch(new UpdateUser({user: this.user}));
        this.store.dispatch(new tagsAction.UpdateCurrentFilter(currentFilter));
    }
}
