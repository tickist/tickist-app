import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {ROUTER_NAVIGATION, RouterNavigationAction} from '@ngrx/router-store';
import {concatMap, filter, withLatestFrom} from 'rxjs/operators';
import {Store} from '@ngrx/store';
import {TasksFiltersService} from '../services/tasks-filters.service';
import {selectLoggedInUser} from '../selectors/user.selectors';
import {setCurrentMainFilter} from "../actions/tasks/main-filters-tasks.actions";
import {setCurrentAssignedToFilter} from "../actions/tasks/assigned-to-filters-tasks.actions";
import {setCurrentEstimateTimeFiltersTasks} from "../actions/tasks/estimate-time-filters-tasks.actions";
import {setCurrentTagsFilters} from "../actions/tasks/tags-filters-tasks.actions";


@Injectable()
export class TasksFiltersEffects {

    changeFiltersOnRouterChange$ = createEffect(() => this.actions$
        .pipe(
            ofType<RouterNavigationAction>(ROUTER_NAVIGATION),
            filter(action => {
                return action.payload.event.url.indexOf('tasks') > 0
                    || action.payload.event.url.indexOf('tags') > 0;
            }),
            withLatestFrom(this.store.select(selectLoggedInUser)),
            concatMap(([action, user]) => {
                const {currentFilter_lt, currentFilter_gt} = TasksFiltersService.getDefaultCurrentEstimateTimeFilters();
                const actions = [];
                actions.push(
                    setCurrentMainFilter({currentFilter: TasksFiltersService.getDefaultCurrentMainFilter()}),
                    setCurrentAssignedToFilter({currentFilter: TasksFiltersService.getAssignedToAllFilter()}),
                    setCurrentEstimateTimeFiltersTasks({currentFilter_gt, currentFilter_lt})
                );
                if (action.payload.event.url.indexOf('tasks-projects-view') > 0) {
                    actions.push(
                        setCurrentTagsFilters({currentTagsFilter: TasksFiltersService.getDefaultCurrentTagsFilters()})
                    );
                }
                return actions;
            })
        ));

    constructor(private actions$: Actions, private  store: Store) {
    }
}
