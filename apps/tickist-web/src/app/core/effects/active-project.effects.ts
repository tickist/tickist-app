import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {ActiveProjectActionTypes, SetActiveProject} from '../actions/projects/active-project.actions';
import {concatMap, withLatestFrom} from 'rxjs/operators';
import {AddNewAssignedToFilter, SetCurrentAssignedToFilter} from '../actions/tasks/assigned-to-filters-tasks.actions';
import {selectTeam} from '../selectors/team.selectors';
import {AppStore} from '../../store';
import {Store} from '@ngrx/store';
import {TasksFiltersService} from '../services/tasks-filters.service';
import {selectLoggedInUser} from '../selectors/user.selectors';
import {ShareWithUser} from '@data/projects';
import {Filter} from '@data/filter';
import {AngularFireAuth} from '@angular/fire/auth';

@Injectable()
export class ActiveProjectEffects {
    @Effect()
    updateAssignedToFilters = this.actions$
        .pipe(
            ofType<SetActiveProject>(ActiveProjectActionTypes.SetActiveProject),
            withLatestFrom(this.store.select(selectTeam), this.store.select(selectLoggedInUser)),
            concatMap(([action, team, user]) => {
                const actions = [];
                const filters = [];
                if (action.payload.project) {
                    action.payload.project.shareWith.map((simpleUserOrPendingUser: ShareWithUser) => {
                        if (simpleUserOrPendingUser.hasOwnProperty('id')
                            && simpleUserOrPendingUser['id'] !== undefined
                            && simpleUserOrPendingUser['id'] !== user.id) {
                                const userId = (<ShareWithUser>simpleUserOrPendingUser).id;
                                filters.push(
                                    new Filter({
                                        'id': simpleUserOrPendingUser['id'],
                                        'label': 'assignedTo',
                                        'value': `(task) => task.owner.id === '${userId}'`,
                                        'name': simpleUserOrPendingUser.username
                                    })
                                );
                        }
                    });
                    actions.push(new AddNewAssignedToFilter({filters}));
                    // @TODO move to service tasksFilters kiedy tam będzie porzadek
                    actions.push(new SetCurrentAssignedToFilter({
                        currentFilter: new Filter({
                            id: 0,
                            label: 'assignedTo',
                            value: `task => true`,
                            name: 'all',
                            avatar: '/assets/default_avatar.png',
                            fixed: true
                        })
                    }));
                } else {
                    team.forEach(mate => {
                        if (mate.id !== this.authFire.auth.currentUser.uid) {
                            filters.push(
                                new Filter({
                                    'id': mate.id,
                                    'label': 'assignedTo',
                                    'value': `task => task.owner.id === '${mate.id}'`,
                                    'name': mate.username
                                })
                            );
                        }
                    });
                    actions.push(new AddNewAssignedToFilter({filters}));
                    actions.push(new SetCurrentAssignedToFilter({currentFilter: TasksFiltersService.getAssignedToMeFilter(user)}));
                }
                return actions;
            })
        );

    constructor(private actions$: Actions, private store: Store<{}>, private authFire: AngularFireAuth) {
    }
}
