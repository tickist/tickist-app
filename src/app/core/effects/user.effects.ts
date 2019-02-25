import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {AddUser, UpdateUser, UserActionTypes} from '../actions/user.actions';
import {concatMap, concatMapTo, filter, mapTo, mergeMap} from 'rxjs/operators';
import {AddNewAssignedToFilter, SetCurrentAssignedToFilter} from '../actions/assigned-to-filters-tasks.actions';
import {AddEstimateTimeFiltersTasks, SetCurrentEstimateTimeFiltersTasks} from '../actions/estimate-time-filters-tasks.actions';
import {TasksFiltersService} from '../../tasks/tasks-filters.service';
import {AddMainFilters, SetCurrentMainFilter} from '../actions/main-filters-tasks.actions';
import {SetCurrentTagsFilters} from '../actions/tags-filters-tasks.actions';
import {
    LoadChartStatistics,
    LoadDailyStatistics,
    LoadGlobalStatistics,
    LoadGlobalStatisticsDateRange
} from '../../modules/statistics-view/actions/statistics.actions';
import {LoadTeams} from '../actions/team.actions';
import {UserService} from '../services/user.service';
import {RequestsAllTasks, TaskActionTypes, UpdateTask} from '../actions/task.actions';
import {SwitchOffProgressBar, SwitchOnProgressBar} from '../actions/progress-bar.actions';
import {AddSortByOptions, SetCurrentSortBy} from '../actions/sort-tasks.actions';
import {RequestsAllTags} from '../actions/tags.actions';
import {RequestsAllProjects} from '../actions/projects.actions';



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
                new LoadTeams(),
                new RequestsAllTags(),
                new RequestsAllProjects(),
                new RequestsAllTasks()
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
