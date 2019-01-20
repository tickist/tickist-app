import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {filter, map, mergeMap, withLatestFrom} from 'rxjs/operators';
import {select, Store} from '@ngrx/store';
import {AppStore} from '../store';


import {Update} from '@ngrx/entity';
import {
    AddProjects,
    CreateProject,
    DeleteProject,
    ProjectActionTypes,
    RequestCreateProject,
    RequestsAllProjects,
    UpdateProject
} from './projects.actions';
import {allProjectsLoaded, selectProjectById} from './projects.selectors';
import {ProjectService} from '../services/project.service';
import {Project} from '../models/projects';


@Injectable()
export class ProjectsEffects {

    @Effect()
    addProjects$ = this.actions$
        .pipe(
            ofType<RequestsAllProjects>(ProjectActionTypes.REQUEST_ALL_PROJECTS),
            withLatestFrom(this.store.pipe(select(allProjectsLoaded))),
            filter(([action, allProjectsLoadedValue]) => !allProjectsLoadedValue),
            mergeMap(() => this.projectService.loadProjects()),
            map(projects => new AddProjects({projects: projects}))
        );

    @Effect()
    createProject$ = this.actions$
        .pipe(
            ofType<RequestCreateProject>(ProjectActionTypes.REQUEST_CREATE_PROJECT),
            mergeMap(action => this.projectService.createProject(action.payload.project)),
            map(payload => new CreateProject({project: payload}))
        );

    @Effect({dispatch: false})
    updateProject$ = this.actions$
        .pipe(
            ofType<UpdateProject>(ProjectActionTypes.UPDATE_PROJECT),
            mergeMap((action) => this.store.select(selectProjectById(<number> action.payload.project.id))),
            mergeMap((project: Project, index: number) => this.projectService.updateProject(project))
        );

    @Effect({dispatch: false})
    deleteProject$ = this.actions$
        .pipe(
            ofType<DeleteProject>(ProjectActionTypes.DELETE_PROJECT),
            mergeMap(action => this.projectService.deleteProject(action.payload.projectId))
        );

    constructor(private actions$: Actions, private projectService: ProjectService,
                private store: Store<AppStore>) {

    }

}

