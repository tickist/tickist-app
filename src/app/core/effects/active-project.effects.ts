import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {ActiveProjectActionTypes, SetActiveProject} from '../actions/active-project.actions';
import {concatMap, withLatestFrom} from 'rxjs/operators';
import {PendingUser, SimpleUser} from '../models';
import {AddNewAssignedToFilter, SetCurrentAssignedToFilter} from '../actions/assigned-to-filters-tasks.actions';
import {Filter} from '../../models/filter';
import { Task } from '../../models/tasks';
import {withIdentifier} from 'codelyzer/util/astQuery';
import {selectTeam} from '../selectors/team.selectors';
import {AppStore} from '../../store';
import {Store} from '@ngrx/store';
import {TasksFiltersService} from '../../tasks/tasks-filters.service';
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
                    action.payload.project.shareWith.map((user: (SimpleUser | PendingUser)) => {
                        if (user.hasOwnProperty('id') && user['id'] !== undefined && user['id'] !== parseInt(localStorage.getItem('USER_ID'), 10)) {
                            const userId = (<SimpleUser> user).id;
                            filters.push(
                                new Filter({
                                    'id': user['id'],
                                    'label': 'assignedTo',
                                    'value': `(task) => task.owner.id === ${userId}`,
                                    'name': user.username
                                })
                            );
                        }
                    });
                    actions.push(new AddNewAssignedToFilter({filters}));
                    // @Todo move to service tasksFilters kiedy tam będzie porzadek
                    actions.push(new SetCurrentAssignedToFilter({currentFilter: new Filter({
                            id: 0,
                            label: 'assignedTo',
                            value: `task => true`,
                            name: 'all',
                            avatar: '/assets/default_avatar.png',
                            fixed: true
                        })}));
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
