import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {AddUser, UpdateUser, UserActionTypes} from '../actions/user.actions';
import {concatMap, concatMapTo, filter, mapTo, mergeMap} from 'rxjs/operators';
import {AddNewAssignedToFilter, SetCurrentAssignedToFilter} from '../actions/tasks/assigned-to-filters-tasks.actions';
import {AddEstimateTimeFiltersTasks, SetCurrentEstimateTimeFiltersTasks} from '../actions/tasks/estimate-time-filters-tasks.actions';
import {TasksFiltersService} from '../services/tasks-filters.service';
import {AddMainFilters, SetCurrentMainFilter} from '../actions/tasks/main-filters-tasks.actions';
import {SetCurrentTagsFilters} from '../actions/tasks/tags-filters-tasks.actions';
import {UserService} from '../services/user.service';
import {QueryTasks, UpdateTask} from '../actions/tasks/task.actions';
import {SwitchOffProgressBar, SwitchOnProgressBar} from '../actions/progress-bar.actions';
import {AddSortByOptions, SetCurrentSortBy} from '../actions/tasks/sort-tasks.actions';
import {QueryTags} from '../actions/tags.actions';
import {QueryProjects} from '../actions/projects/projects.actions';


@Injectable()
export class UserEffects {

    @Effect()
    addDefaultAssignedToFilters = this.actions$
        .pipe(
            ofType<AddUser>(UserActionTypes.AddUser),
            concatMap(action => {
                    const assignedToFilters = TasksFiltersService.getDefaultAssignedToFilters(action.payload.user);
                    return [
                        new AddNewAssignedToFilter({filters: assignedToFilters}),
                        new SetCurrentAssignedToFilter({currentFilter: assignedToFilters[0]})
                    ];
                }
            ));

    @Effect()
    addDefaultEstimateTime = this.actions$
        .pipe(
            ofType<AddUser>(UserActionTypes.AddUser),
            concatMap(() => {
                const {filters_lt, filters_gt} = TasksFiltersService.getDefaultEstimateTimeFilters();
                const {currentFilter_lt, currentFilter_gt} = TasksFiltersService.getDefaultCurrentEstimateTimeFilters();
                return [
                    new AddEstimateTimeFiltersTasks({filters_lt, filters_gt}),
                    new SetCurrentEstimateTimeFiltersTasks({currentFilter_gt, currentFilter_lt})
                ];
            })
        );

    @Effect()
    addDefaultMainFilters = this.actions$
        .pipe(
            ofType<AddUser>(UserActionTypes.AddUser),
            concatMapTo([
                new SetCurrentMainFilter({currentFilter: TasksFiltersService.getDefaultCurrentMainFilter()}),
                new AddMainFilters({filters: TasksFiltersService.getDefaultMainFilters()})
            ])
        );

    @Effect()
    addSortBy = this.actions$
        .pipe(
            ofType<AddUser>(UserActionTypes.AddUser),
            concatMapTo([
                new AddSortByOptions({sortByOptions: TasksFiltersService.getAllSortByOptions()}),
                new SetCurrentSortBy({currentSortBy: TasksFiltersService.getDefaultSortByTask()})
            ])
        );

    @Effect()
    addDefaultTagsFilters = this.actions$
        .pipe(
            ofType<AddUser>(UserActionTypes.AddUser),
            mapTo(new SetCurrentTagsFilters({currentTagsFilter: TasksFiltersService.getDefaultCurrentTagsFilters()}))
        );

    @Effect()
    loadUserData$ = this.actions$
        .pipe(
            ofType<AddUser>(UserActionTypes.AddUser),
            concatMapTo([
                // new LoadTeams(),
                new QueryTasks(),
                new QueryTags(),
                new QueryProjects(),
            ])
        );

    @Effect()
    updateUser$ = this.actions$
        .pipe(
            ofType<UpdateUser>(UserActionTypes.UpdateUser),
            mergeMap(action => this.userService.updateUser(action.payload.user)),
            mapTo(new SwitchOffProgressBar())
        );

    @Effect()
    progressBar$ = this.actions$
        .pipe(
            ofType<UpdateTask>(UserActionTypes.UpdateUser),
            filter(action => action.payload.progressBar),
            mapTo(new SwitchOnProgressBar())
        );

    constructor(private actions$: Actions, private userService: UserService) {
    }
}
