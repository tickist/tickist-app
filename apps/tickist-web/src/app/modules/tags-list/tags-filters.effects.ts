import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {addUser} from '../../core/actions/user.actions';
import {concatMap} from 'rxjs/operators';
import {TagsFiltersService} from '../../core/services/tags-filters.service';
import {defer} from 'rxjs';
import {Store} from '@ngrx/store';
import {selectLoggedInUser} from '../../core/selectors/user.selectors';
import {addTagsFilters, setCurrentTagsListFilter} from './tags-filters.actions';
import {setCurrentTagsFilters} from "../../core/actions/tasks/tags-filters-tasks.actions";


@Injectable()
export class TagsFiltersEffects {

    addTagsFilters = createEffect(() => this.actions$
        .pipe(
            ofType(addUser),
            concatMap(action => [
                    addTagsFilters({filters: TagsFiltersService.getAllTagsFilter()}),
                    setCurrentTagsFilters({
                        currentTagsFilter: TagsFiltersService.getDefaultCurrentTagsFilter(action.user.tagsFilterId)
                    })
                ])
        ));

    
    init$ = createEffect(() => defer(() => this.store.select(selectLoggedInUser).pipe(
            concatMap(user => {
                const actions = [];
                if (user) {
                    actions.push(addTagsFilters({filters: TagsFiltersService.getAllTagsFilter()}));
                    actions.push(setCurrentTagsListFilter(
                        {currentFilter: TagsFiltersService.getDefaultCurrentTagsFilter(user.tagsFilterId)}
                    ));
                }
                return actions;
            })
        )));


    constructor(private actions$: Actions, private store: Store) {
    }

}
