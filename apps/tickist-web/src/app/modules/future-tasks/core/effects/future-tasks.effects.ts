import {Injectable} from '@angular/core';
import {Actions, createEffect, Effect, ofType} from '@ngrx/effects';
import {addUser} from '../../../../core/actions/user.actions';
import {concatMap} from 'rxjs/operators';
import {defer} from 'rxjs';
import {selectLoggedInUser} from '../../../../core/selectors/user.selectors';
import {AppStore} from '../../../../store';
import {Store} from '@ngrx/store';
import {FutureTasksFiltersService} from '../services/future-tasks-filters.service';
import {addFutureTasksFilters, setCurrentFutureTaskFilter} from "../actions/future-tasks-filters.actions";

const ALL_DATES = 1;

@Injectable()
export class FutureTasksEffects {

    addTagsFilters = createEffect(() => this.actions$
        .pipe(
            ofType(addUser),
            concatMap(action => [
                    addFutureTasksFilters({filters: FutureTasksFiltersService.getAllFutureTasksFilters()}),
                    setCurrentFutureTaskFilter({
                        currentFilter: FutureTasksFiltersService.getDefaultCurrentTagsFilter(action.user.projectsFilterId)
                    })
                ])
        ));

    
    init$ = createEffect(() => defer(() => this.store.select(selectLoggedInUser).pipe(
            concatMap(user => {
                const actions = [];
                if (user) {
                    actions.push(addFutureTasksFilters({filters: FutureTasksFiltersService.getAllFutureTasksFilters()}));
                    actions.push(setCurrentFutureTaskFilter({
                        currentFilter: FutureTasksFiltersService.getDefaultCurrentTagsFilter(user.projectsFilterId)
                    }));
                } else {
                    actions.push(setCurrentFutureTaskFilter({
                        currentFilter: FutureTasksFiltersService.getDefaultCurrentTagsFilter(ALL_DATES)
                    }));
                }
                return actions;
            })
        )));

    constructor(private actions$: Actions, private store: Store) {
    }

}
