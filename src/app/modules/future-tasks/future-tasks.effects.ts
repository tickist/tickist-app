import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {AddUser, UserActionTypes} from '../../core/actions/user.actions';
import {concatMap} from 'rxjs/operators';
import {defer} from 'rxjs';
import {selectLoggedInUser} from '../../core/selectors/user.selectors';
import {AppStore} from '../../store';
import {Store} from '@ngrx/store';
import {AddFutureTasksFilters, SetCurrentFutureTaskFilter} from './future-tasks-filters.actions';
import {FutureTasksFiltersService} from './future-tasks-filters.service';


@Injectable()
export class FutureTasksEffects {

    @Effect()
    addTagsFilters = this.actions$
        .pipe(
            ofType<AddUser>(UserActionTypes.AddUser),
            concatMap(action => {
                return [
                    new AddFutureTasksFilters({filters: FutureTasksFiltersService.getAllFutureTasksFilters()}),
                    new SetCurrentFutureTaskFilter({currentFilter: FutureTasksFiltersService.getDefaultCurrentTagsFilter(action.payload.user.id)})
                ];
            })
        );

    @Effect()
    init$ = defer(() => {
        return this.store.select(selectLoggedInUser).pipe(
            concatMap(user => {
                return [
                    new AddFutureTasksFilters({filters: FutureTasksFiltersService.getAllFutureTasksFilters()}),
                    new SetCurrentFutureTaskFilter({currentFilter: FutureTasksFiltersService.getDefaultCurrentTagsFilter(user.id)})
                ];
            })
        );
    });

    constructor(private actions$: Actions, private store: Store<AppStore>) {
    }

}
