import { Observable } from "rxjs";
import { Injectable } from "@angular/core";
import { Store } from "@ngrx/store";
import { InviteUser, InviteUserStatus, Project } from "@data/projects";
import { SimpleUser, User } from "@data/users/models";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";
import { TasksFiltersService } from "./tasks-filters.service";
import { selectActiveProject, selectActiveProjectsIds, selectAllProjects } from "../selectors/projects.selectors";
import { requestUpdateProject } from "../actions/projects/projects.actions";
import { Editor } from "@data/users";
import { collection, doc, Firestore, setDoc, updateDoc } from "@angular/fire/firestore";

const projectsCollectionName = "projects";

@Injectable({
    providedIn: "root",
})
export class ProjectService {
    projects$: Observable<Project[]>;
    team: SimpleUser[];
    selectedProject$: Observable<Project>;
    selectedProjectsIds$: Observable<Array<string>>;

    constructor(
        private firestore: Firestore,
        private store: Store,
        public snackBar: MatSnackBar,
        private router: Router,
        private tasksFiltersService: TasksFiltersService
    ) {
        this.projects$ = this.store.select(selectAllProjects);
        this.selectedProject$ = this.store.select(selectActiveProject);
        this.selectedProjectsIds$ = this.store.select(selectActiveProjectsIds);
    }

    addUserToProject(project, email) {
        const entry = { email: email, status: InviteUserStatus.processing };

        this.store.dispatch(
            requestUpdateProject({
                project: {
                    id: project.id,
                    changes: Object.assign({}, project, {
                        inviteUserByEmail: [...project.inviteUserByEmail, entry],
                    }),
                },
            })
        );
    }

    removeUserFormShareWithList(project, deletedUser) {
        const shareWith = project.shareWith.filter((user) => user.id !== deletedUser.id);
        const shareWithIds = project.shareWithIds.filter((userId) => userId !== deletedUser.id);
        this.store.dispatch(
            requestUpdateProject({
                project: {
                    id: project.id,
                    changes: Object.assign({}, project, {
                        shareWith,
                        shareWithIds,
                    }),
                },
            })
        );
    }

    deleteUserFromInviteList(project: Project, deletedUser: InviteUser) {
        const inviteUserByEmail = project.inviteUserByEmail.filter((invitedUser) => invitedUser.email !== deletedUser.email);
        this.store.dispatch(
            requestUpdateProject({
                project: {
                    id: project.id,
                    changes: Object.assign({}, project, { inviteUserByEmail }),
                },
            })
        );
    }

    async createProject(project: Project, user: User) {
        const docRef = doc(collection(this.firestore, projectsCollectionName));
        const editor = {
            id: user.id,
            email: user.email,
            username: user.username,
        } as Editor;
        const newProjectWithLastEditor = { ...project, lastEditor: editor };
        // await setDoc(
        //     docRef,
        //     JSON.parse(
        //         JSON.stringify({
        //             ...newProjectWithLastEditor,
        //             id: docRef.id,
        //         })
        //     )
        // );
        await setDoc(
            docRef,
            JSON.parse(
                JSON.stringify({
                    ...newProjectWithLastEditor,
                    id: docRef.id,
                })
            )
        );

        // const newProject = this.db.collection(projectsCollectionName).ref.doc();
        // const editor = {
        //     id: user.id,
        //     email: user.email,
        //     username: user.username,
        // } as Editor;
        // const newProjectWithLastEditor = { ...project, lastEditor: editor };
        // return newProject.set(
        //     JSON.parse(
        //         JSON.stringify({
        //             ...newProjectWithLastEditor,
        //             id: newProject.id,
        //         })
        //     )
        // );
    }

    async updateProject(project: Project, user: User, withoutSnackBar = false) {
        const editor = {
            id: user.id,
            email: user.email,
            username: user.username,
        } as Editor;
        const projectWithLastEditor = { ...project, lastEditor: editor };
        const docRef = doc(this.firestore, `${projectsCollectionName}/${project.id}`);
        await updateDoc(docRef, JSON.parse(JSON.stringify(projectWithLastEditor)));

        // const editor = {
        //     id: user.id,
        //     email: user.email,
        //     username: user.username,
        // } as Editor;
        // const projectWithLastEditor = { ...project, lastEditor: editor };
        // return this.db
        //     .collection(projectsCollectionName)
        //     .doc(project.id)
        //     .update(JSON.parse(JSON.stringify(projectWithLastEditor)));
    }

    async deleteProject(projectId: string) {
        const docRef = doc(this.firestore, `${projectsCollectionName}/${projectId}`);
        await updateDoc(docRef, { isActive: false });

        //
        // return this.db
        //     .collection(projectsCollectionName)
        //     .doc(projectId)
        //     .update({ isActive: false });
    }

    async leaveProject(project: Project) {
        const docRef = doc(this.firestore, `${projectsCollectionName}/${project.id}`);
        await updateDoc(docRef, { isActive: false });

        // @TODO not working
        // @TODO remove user from shareWith
        // @TODO remove user from shareWithIds
        //     return this.db
        //         .collection(projectsCollectionName)
        //         .doc(project.id)
        //         .update({ isActive: false });
        // }
    }
}
