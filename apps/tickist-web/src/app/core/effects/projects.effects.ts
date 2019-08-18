import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {concatMap, filter, map, mergeMap, switchMap, withLatestFrom} from 'rxjs/operators';
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
import {Project} from '../../../../../../libs/data/src/lib/projects/models';
import {AddTags, DeleteTag, QueryTags, UpdateTag} from '../actions/tags.actions';
import {AddTasks, TaskActionTypes} from '../actions/tasks/task.actions';
import {Task} from '../../../../../../libs/data/src/lib/tasks/models/tasks';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';


@Injectable()
export class ProjectsEffects {

    @Effect()
    queryTasks$ = this.actions$
        .pipe(
            ofType<QueryProjects>(ProjectActionTypes.QUERY_PROJECTS),
            switchMap(action => {
                console.log(action);
                return this.db.collection(
                    'projects',
                    ref => ref
                        .where('shareWithIds', 'array-contains', this.authFire.auth.currentUser.uid)
                        .where('isActive', '==', true)
                ).stateChanges();
            }),
            // mergeMap(action => action),
            concatMap(actions => {
                // debugger;
                const addedProjects: Project[] = [];
                let deletedProjectId: string;
                let updatedProject: Update<Project>;
                // action.payload.doc.data()
                console.log(actions);
                actions.forEach((action => {
                    if (action.type === 'added') {
                        const data: any = action.payload.doc.data();
                        addedProjects.push(new Project({
                            ...data,
                            id: action.payload.doc.id,
                        }));
                    }
                    if (action.type === 'modified') {
                        const data: any = action.payload.doc.data();
                        updatedProject = {
                            id: action.payload.doc.id,
                            changes: new Project({...data})
                        };
                    }
                    if (action.type === 'removed') {
                        deletedProjectId = action.payload.doc.id;
                    }
                }));
                const returnsActions = [];
                if (addedProjects.length > 0) {
                    returnsActions.push( new AddProjects({projects: addedProjects}));
                }
                if (updatedProject) {
                    returnsActions.push(new UpdateProject({project: updatedProject}));
                }
                if (deletedProjectId) {
                    returnsActions.push(new DeleteProject({projectId: deletedProjectId}));
                }
                return returnsActions;
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
            mergeMap(action => this.projectService.updateProject(<Project>action.payload.project.changes))
        );

    @Effect({dispatch: false})
    deleteProject$ = this.actions$
        .pipe(
            ofType<DeleteProject>(ProjectActionTypes.DELETE_PROJECT),
            mergeMap(action => this.projectService.deleteProject(action.payload.projectId))
        );

    constructor(private actions$: Actions, private projectService: ProjectService, private db: AngularFirestore,
                private store: Store<AppStore>, private authFire: AngularFireAuth) {

    }

}

