import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {
    addUser,
    changeAvatar,
    queryUser,
    removeNotificationPermission,
    requestUpdateUser,
    savefcmToken,
    updateUser
} from '../actions/user.actions';
import {concatMap, concatMapTo, filter, map, mapTo, mergeMap, switchMap, withLatestFrom} from 'rxjs/operators';
import {AddNewAssignedToFilter, SetCurrentAssignedToFilter} from '../actions/tasks/assigned-to-filters-tasks.actions';
import {
    AddEstimateTimeFiltersTasks,
    SetCurrentEstimateTimeFiltersTasks
} from '../actions/tasks/estimate-time-filters-tasks.actions';
import {TasksFiltersService} from '../services/tasks-filters.service';
import {AddMainFilters, SetCurrentMainFilter} from '../actions/tasks/main-filters-tasks.actions';
import {SetCurrentTagsFilters} from '../actions/tasks/tags-filters-tasks.actions';
import {UserService} from '../services/user.service';
import {queryTasks} from '../actions/tasks/task.actions';
import {SwitchOffProgressBar, SwitchOnProgressBar} from '../actions/progress-bar.actions';
import {addSortByOptions, setCurrentSortBy} from '../actions/tasks/sort-tasks.actions';
import {queryTags} from '../actions/tags.actions';
import {queryProjects} from '../actions/projects/projects.actions';
import {AngularFirestore} from '@angular/fire/firestore';
import {User} from '@data/users/models';
import {selectLoggedInUser} from '../selectors/user.selectors';
import {Store} from '@ngrx/store';
import {queryNotifications} from '../../modules/notifications/actions/notifications.actions';
import {NotificationPermission} from '@data';


@Injectable()
export class UserEffects {

    queryUser = createEffect(() => this.actions$
        .pipe(
            ofType(queryUser),
            withLatestFrom(this.store.select(selectLoggedInUser)),
            switchMap(([action, user]) => {
                console.log(action);
                console.log({user});
                return this.db.collection('users', ref => ref
                    .where('id', '==', user.id)
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
                    returnsActions.push(updateUser({user: updatedUser}));
                }
                return returnsActions;
            })
        ));


    addDefaultAssignedToFilters = createEffect(() => this.actions$
        .pipe(
            ofType(addUser),
            concatMap(action => {
                    const assignedToFilters = TasksFiltersService.getDefaultAssignedToFilters(action.user);
                    return [
                        new AddNewAssignedToFilter({filters: assignedToFilters}),
                        new SetCurrentAssignedToFilter({currentFilter: assignedToFilters[0]})
                    ];
                }
            )));

    addDefaultEstimateTime = createEffect(() => this.actions$
        .pipe(
            ofType(addUser),
            concatMap(() => {
                const {filters_lt, filters_gt} = TasksFiltersService.getDefaultEstimateTimeFilters();
                const {currentFilter_lt, currentFilter_gt} = TasksFiltersService.getDefaultCurrentEstimateTimeFilters();
                return [
                    new AddEstimateTimeFiltersTasks({filters_lt, filters_gt}),
                    new SetCurrentEstimateTimeFiltersTasks({currentFilter_gt, currentFilter_lt})
                ];
            })
        ));


    addDefaultMainFilters = createEffect(() => this.actions$
        .pipe(
            ofType(addUser),
            concatMapTo([
                new SetCurrentMainFilter({currentFilter: TasksFiltersService.getDefaultCurrentMainFilter()}),
                new AddMainFilters({filters: TasksFiltersService.getDefaultMainFilters()})
            ])
        ));

    addSortBy = createEffect(() => this.actions$
        .pipe(
            ofType(addUser),
            concatMapTo([
                addSortByOptions({sortByOptions: TasksFiltersService.getAllSortByOptions()}),
                setCurrentSortBy({currentSortBy: TasksFiltersService.getDefaultSortByTask()})
            ])
        ));

    addDefaultTagsFilters = createEffect(() => this.actions$
        .pipe(
            ofType(addUser),
            mapTo(new SetCurrentTagsFilters({currentTagsFilter: TasksFiltersService.getDefaultCurrentTagsFilters()}))
        ));

    loadUserData$ = createEffect(() => this.actions$
        .pipe(
            ofType(addUser),
            concatMapTo([
                queryUser(),
                queryTasks(),
                queryTags(),
                queryProjects(),
                queryNotifications()
            ])
        ));

    updateUser$ = createEffect(() => this.actions$
        .pipe(
            ofType(requestUpdateUser),
            mergeMap(action => this.userService.updateUser(action.user)),
            mapTo(new SwitchOffProgressBar())
        ), {dispatch: false});

    progressBar$ = createEffect(() => this.actions$
        .pipe(
            ofType(requestUpdateUser),
            filter(action => action.progressBar),
            mapTo(new SwitchOnProgressBar())
        ));

    changeAvatar$ = createEffect(() => this.actions$.pipe(
        ofType(changeAvatar),
        withLatestFrom(this.store.select(selectLoggedInUser)),
        map(([action, user]) => {
            return requestUpdateUser({user: Object.assign({}, user, {avatarUrl: action.avatarUrl})});
        })
    ));

    savefcmToken$ = createEffect(() => this.actions$.pipe(
        ofType(savefcmToken),
        withLatestFrom(this.store.select(selectLoggedInUser)),
        map(([action, user]) => {
            return requestUpdateUser({
                user: Object.assign({},
                    user,
                    {fcmToken: action.token, notificationPermission: NotificationPermission.yes}
                )
            });
        })
    ));

    removeNotificationPermission$ = createEffect(() => this.actions$.pipe(
        ofType(removeNotificationPermission),
        withLatestFrom(this.store.select(selectLoggedInUser)),
        map(([, user]) => {
            return  requestUpdateUser({
                user: Object.assign({},
                    user,
                    {fcmToken: null, notificationPermission: NotificationPermission.no}
                )
            });
        })
    ));

    constructor(private actions$: Actions, private db: AngularFirestore, private store: Store,
                private userService: UserService) {
    }
}
