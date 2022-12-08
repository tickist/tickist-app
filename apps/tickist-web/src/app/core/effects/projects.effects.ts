import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { concatMap, map, mergeMap, switchMap, withLatestFrom } from "rxjs/operators";
import { Store } from "@ngrx/store";
import { Update } from "@ngrx/entity";
import {
    addProjects,
    deleteProject,
    queryProjects,
    requestCreateProject,
    requestDeleteProject,
    requestUpdateProject,
    updateProject,
} from "../actions/projects/projects.actions";
import { ProjectService } from "../services/project.service";
import { Project } from "@data/projects";
import { MatLegacySnackBar as MatSnackBar } from "@angular/material/legacy-snack-bar";
import { selectLoggedInUser } from "../selectors/user.selectors";
import { collection, collectionChanges, Firestore, query, where } from "@angular/fire/firestore";

@Injectable()
export class ProjectsEffects {
    queryTasks$ = createEffect(() =>
        this.actions$.pipe(
            ofType(queryProjects),
            withLatestFrom(this.store.select(selectLoggedInUser)),
            switchMap(
                ([, user]) => {
                    const firebaseCollection = collection(this.firestore, "projects");
                    const firebaseQuery = query(
                        firebaseCollection,
                        where("isActive", "==", true),
                        where("shareWithIds", "array-contains", user.id)
                    );
                    return collectionChanges(firebaseQuery);
                }
                // this.db
                //     .collection("projects", (ref) =>
                //         ref
                //             .where("isActive", "==", true)
                //             .where("shareWithIds", "array-contains", user.id)
                //     )
                //     .stateChanges()
            ),
            concatMap((actions) => {
                console.log({ actions });
                console.log({ actions });
                const addedProjects: Project[] = [];
                let deletedProjectId: string;
                let updatedProject: Update<Project>;
                actions.forEach((action) => {
                    console.log(action.doc.data());
                    if (action.type === "added") {
                        const data: any = action.doc.data();
                        addedProjects.push(
                            new Project({
                                ...data,
                                id: action.doc.id,
                            })
                        );
                    }
                    if (action.type === "modified") {
                        const data: any = action.doc.data();
                        updatedProject = {
                            id: action.doc.id,
                            changes: new Project({ ...data }),
                        };
                    }
                    if (action.type === "removed") {
                        deletedProjectId = action.doc.id;
                    }
                });
                const returnsActions = [];
                if (addedProjects.length > 0) {
                    returnsActions.push(addProjects({ projects: addedProjects }));
                }
                if (updatedProject) {
                    returnsActions.push(updateProject({ project: updatedProject }));
                }
                if (deletedProjectId) {
                    returnsActions.push(deleteProject({ projectId: deletedProjectId }));
                }
                return returnsActions;
            })
        )
    );

    createProject$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(requestCreateProject),
                withLatestFrom(this.store.select(selectLoggedInUser)),
                mergeMap(([action, user]) => this.projectService.createProject(action.project, user))
            ),
        { dispatch: false }
    );

    updateProject$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(requestUpdateProject),
                withLatestFrom(this.store.select(selectLoggedInUser)),
                mergeMap(([action, user]) => this.projectService.updateProject(<Project>action.project.changes, user))
            ),
        { dispatch: false }
    );

    deleteProject$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(requestDeleteProject),
                mergeMap((action) => this.projectService.deleteProject(action.projectId)),
                map(() =>
                    this.snackBar.open("Project has been deleted successfully", "", {
                        duration: 2000,
                    })
                )
            ),
        { dispatch: false }
    );

    constructor(
        private actions$: Actions,
        private projectService: ProjectService,
        private firestore: Firestore,
        private store: Store,
        public snackBar: MatSnackBar
    ) {}
}
