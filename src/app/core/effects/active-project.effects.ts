import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {ActiveProjectActionTypes, SetActiveProject} from '../actions/projects/active-project.actions';
import {concatMap, withLatestFrom} from 'rxjs/operators';
import {PendingUser, SimpleUser} from '../models';
import {AddNewAssignedToFilter, SetCurrentAssignedToFilter} from '../actions/tasks/assigned-to-filters-tasks.actions';
import {Filter} from '../../models/filter';
import {selectTeam} from '../selectors/team.selectors';
import {AppStore} from '../../store';
import {Store} from '@ngrx/store';
import {TasksFiltersService} from '../services/tasks-filters.service';
import {selectLoggedInUser} from '../selectors/user.selectors';

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
                    action.payload.project.shareWith.map((simpleUserOrPendingUser: (SimpleUser | PendingUser)) => {
                        if (simpleUserOrPendingUser.hasOwnProperty('id')
                            && simpleUserOrPendingUser['id'] !== undefined
                            && simpleUserOrPendingUser['id'] !== user.id) {
                                const userId = (<SimpleUser>simpleUserOrPendingUser).id;
                                filters.push(
                                    new Filter({
                                        'id': simpleUserOrPendingUser['id'],
                                        'label': 'assignedTo',
                                        'value': `(task) => task.owner.id === ${userId}`,
                                        'name': simpleUserOrPendingUser.username
                                    })
                                );
                        }
                    });
                    actions.push(new AddNewAssignedToFilter({filters}));
                    // @Todo move to service tasksFilters kiedy tam będzie porzadek
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
                        if (mate.id !== parseInt(localStorage.getItem('USER_ID'), 10)) {
                            filters.push(
                                new Filter({
                                    'id': mate.id,
                                    'label': 'assignedTo',
                                    'value': `task => task.owner.id === ${mate.id}`,
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

    constructor(private actions$: Actions, private store: Store<AppStore>) {
    }
}
