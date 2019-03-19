import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {AddUser, UserActionTypes} from '../../../../core/actions/user.actions';
import {concatMap, mapTo} from 'rxjs/operators';
import {SetCurrentTagsFilters} from '../../../../core/actions/tags-filters-tasks.actions';
import {TasksFiltersService} from '../../../../tasks/tasks-filters.service';
import {TagsFiltersService} from '../../../../services/tags-filters.service';
import {AddTagsFilters, SetCurrentTagsListFilter} from './tags-filters.actions';
import {defer, of} from 'rxjs';
import {AppStore} from '../../../../store';
import {Store} from '@ngrx/store';
import {selectLoggedInUser} from '../../../../core/selectors/user.selectors';


@Injectable()
export class TagsFiltersEffects {

    @Effect()
    addTagsFilters = this.actions$
        .pipe(
            ofType<AddUser>(UserActionTypes.AddUser),
            concatMap(action => {
                return [
                    new AddTagsFilters({filters: TagsFiltersService.getAllTagsFilter()}),
                    new SetCurrentTagsFilters({
                        currentTagsFilter: TagsFiltersService.getDefaultCurrentTagsFilter(action.payload.user.tagsFilterId)
                    })
                ];
            })
        );

    @Effect()
    init$ = defer(() => {
        return this.store.select(selectLoggedInUser).pipe(
            concatMap(user => {
            return [
                new AddTagsFilters({filters: TagsFiltersService.getAllTagsFilter()}),
                new SetCurrentTagsListFilter({currentFilter: TagsFiltersService.getDefaultCurrentTagsFilter(user.tagsFilterId)})
            ];
        })
        );
    });


    constructor(private actions$: Actions, private store: Store<AppStore>) {
    }

}
