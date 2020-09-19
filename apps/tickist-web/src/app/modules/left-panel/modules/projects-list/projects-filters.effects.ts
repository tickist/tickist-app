import {Injectable} from '@angular/core';
import {Actions, createEffect, Effect, ofType} from '@ngrx/effects';
import {addUser} from '../../../../core/actions/user.actions';
import {concatMap} from 'rxjs/operators';
import {defer} from 'rxjs';
import {selectLoggedInUser} from '../../../../core/selectors/user.selectors';
import {AppStore} from '../../../../store';
import {Store} from '@ngrx/store';
import {AddProjectsFilters, SetCurrentProjectFilter} from './projects-filters.actions';
import {ProjectsFiltersService} from './projects-filters.service';


@Injectable()
export class ProjectsFiltersEffects {

    addTagsFilters = createEffect(() => this.actions$
        .pipe(
            ofType(addUser),
            concatMap(action => {
                return [
                    new AddProjectsFilters({filters: ProjectsFiltersService.getAllProjectsFilters()}),
                    new SetCurrentProjectFilter({
                        currentFilter: ProjectsFiltersService.getDefaultCurrentProjectsFilter(action.user.projectsFilterId)
                    })
                ];
            })
        ));

    @Effect()
    init$ = defer(() => {
        return this.store.select(selectLoggedInUser).pipe(
            concatMap(user => {
                const actions = [];
                if (user) {
                    actions.push(new AddProjectsFilters({filters: ProjectsFiltersService.getAllProjectsFilters()}));
                    actions.push(new SetCurrentProjectFilter({
                        currentFilter: ProjectsFiltersService.getDefaultCurrentProjectsFilter(user.projectsFilterId)
                    }));
                }
                return actions;
            })
        );
    });

    constructor(private actions$: Actions, private store: Store) {
    }

}
