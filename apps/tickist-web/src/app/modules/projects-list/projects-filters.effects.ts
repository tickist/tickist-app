import {Injectable} from '@angular/core';
import {Actions, createEffect, Effect, ofType} from '@ngrx/effects';
import {addUser} from '../../core/actions/user.actions';
import {concatMap} from 'rxjs/operators';
import {defer} from 'rxjs';
import {selectLoggedInUser} from '../../core/selectors/user.selectors';
import {Store} from '@ngrx/store';
import {ProjectsFiltersService} from './projects-filters.service';
import {addProjectsFilters, setCurrentProjectFilter,} from "./projects-filters.actions";


@Injectable()
export class ProjectsFiltersEffects {

    addTagsFilters = createEffect(() => this.actions$
        .pipe(
            ofType(addUser),
            concatMap(action => [
                    addProjectsFilters({filters: ProjectsFiltersService.getAllProjectsFilters()}),
                    setCurrentProjectFilter({
                        currentFilter: ProjectsFiltersService.getDefaultCurrentProjectsFilter(action.user.projectsFilterId)
                    })
                ])
        ));

    
    init$ = createEffect(() => defer(() => this.store.select(selectLoggedInUser).pipe(
            concatMap(user => {
                const actions = [];
                if (user) {
                    actions.push(addProjectsFilters({filters: ProjectsFiltersService.getAllProjectsFilters()}));
                    actions.push(setCurrentProjectFilter({
                        currentFilter: ProjectsFiltersService.getDefaultCurrentProjectsFilter(user.projectsFilterId)
                    }));
                }
                return actions;
            })
        )));

    constructor(private actions$: Actions, private store: Store) {
    }

}
