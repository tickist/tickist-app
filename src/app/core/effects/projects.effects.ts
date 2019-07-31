import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {filter, map, mergeMap, switchMap, withLatestFrom} from 'rxjs/operators';
import {select, Store} from '@ngrx/store';
import {AppStore} from '../../store';


import {Update} from '@ngrx/entity';
import {
    AddProjects,
    CreateProject,
    DeleteProject,
    ProjectActionTypes, QueryProjects,
    RequestCreateProject,
    RequestsAllProjects, RequestUpdateProject,
    UpdateProject
} from '../actions/projects/projects.actions';
import {allProjectsLoaded, selectProjectById} from '../selectors/projects.selectors';
import {ProjectService} from '../services/project.service';
import {Project} from '../../models/projects';
import {QueryTags} from '../actions/tags.actions';
import {AddTasks, TaskActionTypes} from '../actions/tasks/task.actions';
import {Task} from '../../models/tasks';
import {AngularFirestore} from '@angular/fire/firestore';


@Injectable()
export class ProjectsEffects {

    @Effect()
    queryTasks$ = this.actions$
        .pipe(
            ofType<QueryProjects>(ProjectActionTypes.QUERY_PROJECTS),
            switchMap(action => {
                console.log(action);
                return this.db.collection('projects').stateChanges();
            }),
            // mergeMap(action => action),
            map(actions => {
                // debugger;
                const addedProjects: Project[] = [];
                const deletedProjects: Project[] = [];
                const updatedProjects: Project[] = [];
                // action.payload.doc.data()
                console.log(actions);
                actions.forEach((action => {
                    if (action.type === 'added') {
                        const data: any = action.payload.doc.data();
                        addedProjects.push(new Project({
                            id: action.payload.doc.id,
                            ...data
                        }));
                    }
                }));
                return new AddProjects({projects: addedProjects});
            })
        );
    
    // @Effect()
    // addProjects$ = this.actions$
    //     .pipe(
    //         ofType<RequestsAllProjects>(ProjectActionTypes.REQUEST_ALL_PROJECTS),
    //         withLatestFrom(this.store.pipe(select(allProjectsLoaded))),
    //         filter(([action, allProjectsLoadedValue]) => !allProjectsLoadedValue),
    //         mergeMap(() => this.projectService.loadProjects()),
    //         map(projects => new AddProjects({projects: projects}))
    //     );

    @Effect({dispatch: false})
    createProject$ = this.actions$
        .pipe(
            ofType<RequestCreateProject>(ProjectActionTypes.REQUEST_CREATE_PROJECT),
            mergeMap(action => this.projectService.createProject(action.payload.project))
        );

    @Effect({dispatch: false})
    updateProject$ = this.actions$
        .pipe(
            ofType<RequestUpdateProject>(ProjectActionTypes.REQUEST_UPDATE_PROJECT),
            mergeMap(action => this.projectService.updateProject(<Project> action.payload.project.changes))
        );

    @Effect({dispatch: false})
    deleteProject$ = this.actions$
        .pipe(
            ofType<DeleteProject>(ProjectActionTypes.DELETE_PROJECT),
            mergeMap(action => this.projectService.deleteProject(action.payload.projectId))
        );

    constructor(private actions$: Actions, private projectService: ProjectService, private db: AngularFirestore,
                private store: Store<AppStore>) {

    }

}

