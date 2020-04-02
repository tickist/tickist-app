import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {concatMap, map, mergeMap, switchMap, withLatestFrom} from 'rxjs/operators';
import {Store} from '@ngrx/store';
import {AppStore} from '../../store';
import {Update} from '@ngrx/entity';
import {
    AddProjects,
    DeleteProject,
    ProjectActionTypes,
    QueryProjects,
    RequestCreateProject, RequestDeleteProject,
    RequestUpdateProject,
    UpdateProject
} from '../actions/projects/projects.actions';
import {ProjectService} from '../services/project.service';
import {Project} from '@data/projects';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';
import { MatSnackBar } from '@angular/material/snack-bar';
import {selectLoggedInUser} from '../selectors/user.selectors';


@Injectable()
export class ProjectsEffects {

    @Effect()
    queryTasks$ = this.actions$
        .pipe(
            ofType<QueryProjects>(ProjectActionTypes.QUERY_PROJECTS),
            withLatestFrom(this.store.select(selectLoggedInUser)),
            switchMap(([, user]) => {
                return this.db.collection(
                    'projects',
                    ref => ref
                        .where('isActive', '==', true)
                        .where('shareWithIds', 'array-contains', user.id)
                ).stateChanges();
            }),
            concatMap(actions => {
                const addedProjects: Project[] = [];
                let deletedProjectId: string;
                let updatedProject: Update<Project>;
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
                    returnsActions.push(new AddProjects({projects: addedProjects}));
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

    @Effect({dispatch: false})
    createProject$ = this.actions$
        .pipe(
            ofType<RequestCreateProject>(ProjectActionTypes.REQUEST_CREATE_PROJECT),
            withLatestFrom(this.store.select(selectLoggedInUser)),
            mergeMap(([action, user]) => this.projectService.createProject(action.payload.project, user))
        );

    @Effect({dispatch: false})
    updateProject$ = this.actions$
        .pipe(
            ofType<RequestUpdateProject>(ProjectActionTypes.REQUEST_UPDATE_PROJECT),
            withLatestFrom(this.store.select(selectLoggedInUser)),
            mergeMap(([action, user]) => this.projectService.updateProject(<Project>action.payload.project.changes, user))
        );

    @Effect({dispatch: false})
    deleteProject$ = this.actions$
        .pipe(
            ofType<RequestDeleteProject>(ProjectActionTypes.REQUEST_DELETE_PROJECT),
            mergeMap(action => this.projectService.deleteProject(action.payload.projectId)),
            map(() => this.snackBar.open('Project has been deleted successfully', '', {
                duration: 2000,
            }))
        );

    constructor(private actions$: Actions, private projectService: ProjectService, private db: AngularFirestore,
                private store: Store<{}>, private authFire: AngularFireAuth, public snackBar: MatSnackBar) {

    }

}

