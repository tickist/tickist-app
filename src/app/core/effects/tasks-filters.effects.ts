import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {ROUTER_NAVIGATED, ROUTER_NAVIGATION, RouterNavigationAction} from '@ngrx/router-store';
import {concatMap, concatMapTo, filter, map, withLatestFrom} from 'rxjs/operators';
import {select, Store} from '@ngrx/store';
import {AppStore} from '../../store';
import {SetCurrentAssignedToFilter} from '../actions/tasks/assigned-to-filters-tasks.actions';
import {TasksFiltersService} from '../services/tasks-filters.service';
import {selectLoggedInUser} from '../selectors/user.selectors';
import {SetCurrentMainFilter} from '../actions/tasks/main-filters-tasks.actions';
import {SetCurrentTagsFilters} from '../actions/tasks/tags-filters-tasks.actions';
import {SetCurrentEstimateTimeFiltersTasks} from '../actions/tasks/estimate-time-filters-tasks.actions';


@Injectable()
export class TasksFiltersEffects {
    @Effect()
    changeFiltersOnRouterChange$ = this.actions$
        .pipe(
            ofType<RouterNavigationAction>(ROUTER_NAVIGATION),
            filter(action => {
                return action.payload.event.urlAfterRedirects.indexOf('tasks') > 0
                    || action.payload.event.urlAfterRedirects.indexOf('tags') > 0;
            }),
            withLatestFrom(this.store.select(selectLoggedInUser)),
            concatMap(([action, user]) => {
                const {currentFilter_lt, currentFilter_gt} = TasksFiltersService.getDefaultCurrentEstimateTimeFilters();
                return [
                    new SetCurrentMainFilter({currentFilter: TasksFiltersService.getDefaultCurrentMainFilter()}),
                    new SetCurrentAssignedToFilter({currentFilter: TasksFiltersService.getAssignedToAllFilter()}),
                    new SetCurrentTagsFilters({currentTagsFilter: TasksFiltersService.getDefaultCurrentTagsFilters()}),
                    new SetCurrentEstimateTimeFiltersTasks({currentFilter_gt, currentFilter_lt})
                ];
            })
        );

    constructor(private actions$: Actions, private  store: Store<AppStore>) {
    }
}