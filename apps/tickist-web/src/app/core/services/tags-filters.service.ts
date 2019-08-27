import {Observable, pipe} from 'rxjs';
import {Injectable} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppStore} from '../../store';
import {SimpleUser, User} from '../../../../../../libs/data/src/users/models';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as tagsAction from '../../modules/left-panel/modules/tags-list/tags-filters.actions';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {UserService} from './user.service';
import {UpdateUser} from '../actions/user.actions';
import {Filter} from '@data/filter';


@Injectable()
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
