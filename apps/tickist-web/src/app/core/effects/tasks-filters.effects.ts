import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { ROUTER_NAVIGATION, RouterNavigationAction } from "@ngrx/router-store";
import { concatMap, filter, map, withLatestFrom } from "rxjs/operators";
import { Store } from "@ngrx/store";
import { TasksFiltersService } from "../services/tasks-filters.service";
import { selectLoggedInUser } from "../selectors/user.selectors";
import { setCurrentMainFilter } from "../actions/tasks/main-filters-tasks.actions";
import { setCurrentAssignedToFilter } from "../actions/tasks/assigned-to-filters-tasks.actions";
import { setCurrentEstimateTimeFiltersTasks } from "../actions/tasks/estimate-time-filters-tasks.actions";
import { setCurrentTagsFilters } from "../actions/tasks/tags-filters-tasks.actions";
import {
    clearSearchTasksFilter,
    goToElement,
} from "../actions/tasks/search-tasks.actions";

@Injectable()
export class TasksFiltersEffects {
    changeFiltersOnRouterChange$ = createEffect(() =>
        this.actions$.pipe(
            ofType<RouterNavigationAction>(ROUTER_NAVIGATION),
            filter(
                (action) =>
                    action.payload.event.url.indexOf("tasks") > 0 ||
                    action.payload.event.url.indexOf("tags") > 0
            ),
            withLatestFrom(this.store.select(selectLoggedInUser)),
            concatMap(([action, user]) => {
                const { currentFilterLt, currentFilterGt } =
                    TasksFiltersService.getDefaultCurrentEstimateTimeFilters();
                const actions = [];
                actions.push(
                    setCurrentMainFilter({
                        currentFilter:
                            TasksFiltersService.getDefaultCurrentMainFilter(),
                    }),
                    setCurrentAssignedToFilter({
                        currentFilter:
                            TasksFiltersService.getAssignedToAllFilter(),
                    }),
                    setCurrentEstimateTimeFiltersTasks({
                        currentFilterGt,
                        currentFilterLt,
                    })
                );
                if (
                    action.payload.event.url.indexOf("tasks-projects-view") > 0
                ) {
                    actions.push(
                        setCurrentTagsFilters({
                            currentTagsFilter:
                                TasksFiltersService.getDefaultCurrentTagsFilters(),
                        })
                    );
                }
                return actions;
            })
        )
    );

    clearSearchBar$ = createEffect(() =>
        this.actions$.pipe(
            ofType<RouterNavigationAction>(ROUTER_NAVIGATION),
            map((action) => {
                const queryParams = action.payload.routerState["queryParams"];
                if (queryParams["goToElement"]) {
                    return goToElement();
                } else {
                    return clearSearchTasksFilter();
                }
            })
        )
    );

    constructor(private actions$: Actions, private store: Store) {}
}
