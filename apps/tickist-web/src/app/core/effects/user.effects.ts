import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {AddUser, QueryUser, RequestUpdateUser, UpdateUser, UserActionTypes} from '../actions/user.actions';
import {concatMap, concatMapTo, filter, mapTo, mergeMap, switchMap} from 'rxjs/operators';
import {AddNewAssignedToFilter, SetCurrentAssignedToFilter} from '../actions/tasks/assigned-to-filters-tasks.actions';
import {AddEstimateTimeFiltersTasks, SetCurrentEstimateTimeFiltersTasks} from '../actions/tasks/estimate-time-filters-tasks.actions';
import {TasksFiltersService} from '../services/tasks-filters.service';
import {AddMainFilters, SetCurrentMainFilter} from '../actions/tasks/main-filters-tasks.actions';
import {SetCurrentTagsFilters} from '../actions/tasks/tags-filters-tasks.actions';
import {UserService} from '../services/user.service';
import {QueryTasks} from '../actions/tasks/task.actions';
import {SwitchOffProgressBar, SwitchOnProgressBar} from '../actions/progress-bar.actions';
import {AddSortByOptions, SetCurrentSortBy} from '../actions/tasks/sort-tasks.actions';
import {QueryTags} from '../actions/tags.actions';
import {QueryProjects} from '../actions/projects/projects.actions';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';
import {User} from '../../../../../../libs/data/src/lib/users/models';


@Injectable()
export class UserEffects {

    @Effect()
    queryUser = this.actions$
        .pipe(
            ofType<QueryUser>(UserActionTypes.QueryUser),
            switchMap(action => {
                console.log(action);
                return this.db.collection('users', ref => ref
                    .where('id', '==', this.authFire.auth.currentUser.uid)
                ).stateChanges();

            }),
            concatMap(actions => {
                let updatedUser: User;
                console.log(actions);
                actions.forEach((action => {
                    if (action.type === 'modified') {
                        const data: any = action.payload.doc.data();
                        updatedUser = new User(data);
                    }
                }));
                const returnsActions = [];
                if (updatedUser) {
                    returnsActions.push(new UpdateUser({user: updatedUser}));
                }
                return returnsActions;
            })
        );


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
                new QueryUser(),
                new QueryTasks(),
                new QueryTags(),
                new QueryProjects(),
            ])
        );

    @Effect({dispatch: false})
    updateUser$ = this.actions$
        .pipe(
            ofType<RequestUpdateUser>(UserActionTypes.RequestUpdateUser),
            mergeMap(action => this.userService.updateUser(action.payload.user)),
            mapTo(new SwitchOffProgressBar())
        );

    @Effect()
    progressBar$ = this.actions$
        .pipe(
            ofType<RequestUpdateUser>(UserActionTypes.RequestUpdateUser),
            filter(action => action.payload.progressBar),
            mapTo(new SwitchOnProgressBar())
        );

    constructor(private actions$: Actions, private db: AngularFirestore,
                private userService: UserService, private authFire: AngularFireAuth) {
    }
}
