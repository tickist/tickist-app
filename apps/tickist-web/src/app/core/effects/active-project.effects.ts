import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {concatMap, concatMapTo, filter, withLatestFrom} from 'rxjs/operators';
import {selectTeam} from '../selectors/team.selectors';
import {Store} from '@ngrx/store';
import {TasksFiltersService} from '../services/tasks-filters.service';
import {selectLoggedInUser} from '../selectors/user.selectors';
import {ShareWithUser} from '@data/projects';
import {Filter} from '@data/filter';
import {clearActiveProject, setActiveProject} from "../actions/projects/active-project.actions";
import {addNewAssignedToFilter, setCurrentAssignedToFilter} from "../actions/tasks/assigned-to-filters-tasks.actions";
import {ROUTER_NAVIGATED, RouterNavigationAction} from "@ngrx/router-store";
import {clearActiveProjectsId} from "../actions/projects/active-projects-ids.actions";

@Injectable()
export class ActiveProjectEffects {

    updateAssignedToFilters = createEffect(() => this.actions$
        .pipe(
            ofType(setActiveProject),
            withLatestFrom(this.store.select(selectTeam), this.store.select(selectLoggedInUser)),
            filter(([,,user]) => !!user),
            concatMap(([action, team, user]) => {
                const actions = [];
                const filters = [];
                if (action.project) {
                    action.project.shareWith.map((simpleUserOrPendingUser: ShareWithUser) => {
                        if (simpleUserOrPendingUser.id
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
                    actions.push(addNewAssignedToFilter({filters}));
                    // @TODO move to service tasksFilters kiedy tam będzie porzadek
                    actions.push(setCurrentAssignedToFilter({
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
                        if (mate.id !== user.id) {
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
                    actions.push(addNewAssignedToFilter({filters}));
                    actions.push(setCurrentAssignedToFilter({currentFilter: TasksFiltersService.getAssignedToMeFilter(user)}));
                }
                return actions;
            })
        ));

    activeProjectRouterChange$ = createEffect(() => this.actions$
        .pipe(
            ofType<RouterNavigationAction>(ROUTER_NAVIGATED),
            filter((action) => action.payload.event.url.indexOf('dashboard') > 0),
            concatMapTo([
                    clearActiveProjectsId(),
                    clearActiveProject()
                ]
            )
        ));

    constructor(private actions$: Actions, private store: Store) {
    }
}
