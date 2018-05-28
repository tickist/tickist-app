import {Observable, pipe} from 'rxjs';
import {Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppStore} from '../store';
import {SimplyUser} from '../models/user';
import {MatSnackBar} from '@angular/material';
import * as tagsAction from '../reducers/actions/tags';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {Filter} from '../models/filter';


@Injectable()
export class TagsFiltersService {
    team: SimplyUser[];
    tagsFilters$: Observable<any>;
    currentTagsFilters$: Observable<any>;

    constructor(public http: HttpClient, private store: Store<AppStore>, protected router: Router) {

        this.tagsFilters$ = this.store.select(s => s.tagsFilters);
        this.currentTagsFilters$ = this.store.select(s => s.currentTagsFilters);
        this.loadTagsFilters();
        this.loadCurrentTagsFilters();
    }

    loadCurrentTagsFilters() {
        const filter = new Filter({'id': 1, 'label': 'filter', 'name': 'All projects', 'value': tag => tag});
        this.store.dispatch(new tagsAction.AddCurrentFilters(filter));
    }

    loadTagsFilters() {
        const filters = [
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
        this.store.dispatch(new tagsAction.AddFilters(filters));
    }

    updateCurrentFilter(currentFilter) {
        this.store.dispatch(new tagsAction.UpdateCurrentFilter(currentFilter));
    }
}
