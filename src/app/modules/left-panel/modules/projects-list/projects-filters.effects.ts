import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {AddUser, UserActionTypes} from '../../../../core/actions/user.actions';
import {concatMap} from 'rxjs/operators';
import {defer} from 'rxjs';
import {selectLoggedInUser} from '../../../../core/selectors/user.selectors';
import {AppStore} from '../../../../store';
import {Store} from '@ngrx/store';
import {AddProjectsFilters, SetCurrentProjectFilter} from './projects-filters.actions';
import {ProjectsFiltersService} from './projects-filters.service';


@Injectable()
export class ProjectsFiltersEffects {

    @Effect()
    addTagsFilters = this.actions$
        .pipe(
            ofType<AddUser>(UserActionTypes.AddUser),
            concatMap(action => {
                return [
                    new AddProjectsFilters({filters: ProjectsFiltersService.getAllProjectsFilters()}),
                    new SetCurrentProjectFilter({
                        currentFilter: ProjectsFiltersService.getDefaultCurrentProjectsFilter(action.payload.user.projectsFilterId)
                    })
                ];
            })
        );

    @Effect()
    init$ = defer(() => {
        return this.store.select(selectLoggedInUser).pipe(
            concatMap(user => {
                return [
                    new AddProjectsFilters({filters: ProjectsFiltersService.getAllProjectsFilters()}),
                    new SetCurrentProjectFilter({
                        currentFilter: ProjectsFiltersService.getDefaultCurrentProjectsFilter(user.projectsFilterId)
                    })
                ];
            })
        );
    });

    constructor(private actions$: Actions, private store: Store<AppStore>) {
    }

}
