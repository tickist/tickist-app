import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {concatMap, map, mergeMap, switchMap, withLatestFrom} from 'rxjs/operators';
import {Store} from '@ngrx/store';
import {Update} from '@ngrx/entity';
import {
    addProjects,
    deleteProject,
    queryProjects,
    requestCreateProject,
    requestDeleteProject,
    requestUpdateProject,
    updateProject
} from '../actions/projects/projects.actions';
import {ProjectService} from '../services/project.service';
import {Project} from '@data/projects';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';
import {MatSnackBar} from '@angular/material/snack-bar';
import {selectLoggedInUser} from '../selectors/user.selectors';


@Injectable()
export class ProjectsEffects {

    queryTasks$ = createEffect(() => this.actions$
        .pipe(
            ofType(queryProjects),
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
                    returnsActions.push(addProjects({projects: addedProjects}));
                }
                if (updatedProject) {
                    returnsActions.push(updateProject({project: updatedProject}));
                }
                if (deletedProjectId) {
                    returnsActions.push(deleteProject({projectId: deletedProjectId}));
                }
                return returnsActions;
            })
        ));

    createProject$ = createEffect(() => this.actions$
        .pipe(
            ofType(requestCreateProject),
            withLatestFrom(this.store.select(selectLoggedInUser)),
            mergeMap(([action, user]) => this.projectService.createProject(action.project, user))
        ), {dispatch: false});

    updateProject$ = createEffect(() => this.actions$
        .pipe(
            ofType(requestUpdateProject),
            withLatestFrom(this.store.select(selectLoggedInUser)),
            mergeMap(([action, user]) => this.projectService.updateProject(<Project>action.project.changes, user))
        ), {dispatch: false});

    deleteProject$ =createEffect(() => this.actions$
        .pipe(
            ofType(requestDeleteProject),
            mergeMap(action => this.projectService.deleteProject(action.projectId)),
            map(() => this.snackBar.open('Project has been deleted successfully', '', {
                duration: 2000,
            }))
        ), {dispatch: false});

    constructor(private actions$: Actions, private projectService: ProjectService, private db: AngularFirestore,
                private store: Store, private authFire: AngularFireAuth, public snackBar: MatSnackBar) {

    }

}

