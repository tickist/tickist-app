import {Injectable} from '@angular/core';
import {Actions, createEffect, Effect, ofType} from '@ngrx/effects';
import {addUser} from '../../../../core/actions/user.actions';
import {concatMap} from 'rxjs/operators';
import {defer} from 'rxjs';
import {selectLoggedInUser} from '../../../../core/selectors/user.selectors';
import {AppStore} from '../../../../store';
import {Store} from '@ngrx/store';
import {AddFutureTasksFilters, SetCurrentFutureTaskFilter} from '../actions/future-tasks-filters.actions';
import {FutureTasksFiltersService} from '../services/future-tasks-filters.service';

const ALL_DATES = 1;

@Injectable()
export class FutureTasksEffects {

    addTagsFilters = createEffect(() => this.actions$
        .pipe(
            ofType(addUser),
            concatMap(action => {
                return [
                    new AddFutureTasksFilters({filters: FutureTasksFiltersService.getAllFutureTasksFilters()}),
                    new SetCurrentFutureTaskFilter({
                        currentFilter: FutureTasksFiltersService.getDefaultCurrentTagsFilter(action.user.projectsFilterId)
                    })
                ];
            })
        ));

    @Effect()
    init$ = defer(() => {
        return this.store.select(selectLoggedInUser).pipe(
            concatMap(user => {
                const actions = [];
                if (user) {
                    actions.push(new AddFutureTasksFilters({filters: FutureTasksFiltersService.getAllFutureTasksFilters()}));
                    actions.push(new SetCurrentFutureTaskFilter({
                        currentFilter: FutureTasksFiltersService.getDefaultCurrentTagsFilter(user.projectsFilterId)
                    }));
                } else {
                    actions.push(new SetCurrentFutureTaskFilter({
                        currentFilter: FutureTasksFiltersService.getDefaultCurrentTagsFilter(ALL_DATES)
                    }));
                }
                return actions;
            })
        );
    });

    constructor(private actions$: Actions, private store: Store) {
    }

}
