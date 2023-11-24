import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { Store } from "@ngrx/store";
import { getArchivedTasks, saveToStore } from "../actions/archive.actions";
import { map, switchMap } from "rxjs/operators";
import { collection, collectionChanges, Firestore, query, where } from "@angular/fire/firestore";

@Injectable()
export class ArchiveEffects {
    queryArchivedTasks$ = createEffect(() =>
        this.actions$.pipe(
            ofType(getArchivedTasks),
            switchMap(
                ({ projectId, userId }) => {
                    const firebaseCollection = collection(this.firestore, "tasks");
                    const firebaseQuery = query(
                        firebaseCollection,
                        where("isActive", "==", true),
                        where("taskProject.shareWithIds", "array-contains", userId),
                        where("taskProject.id", "==", projectId),
                        where("isDone", "==", true),
                    );
                    console.log(collectionChanges(firebaseQuery));
                    return collectionChanges(firebaseQuery);
                },
                // this.db
                //     .collection("tasks", (ref) =>
                //         ref
                //             .where("isActive", "==", true)
                //             .where(
                //                 "taskProject.shareWithIds",
                //                 "array-contains",
                //                 userId
                //             )
                //             .where("taskProject.id", "==", projectId)
                //             .where("isDone", "==", true)
                //     )
                //     .valueChanges()
            ),
            // concatMap((actions) => {
            //     const addedTasks: Task[] = [];
            //
            // }),
            map((tasks) => {
                const archivedTasks = [];
                tasks.forEach((task) => {
                    archivedTasks.push(task.doc.data());
                });
                return saveToStore({ archivedTasks });
            }),
        ),
    );

    constructor(
        private actions$: Actions,
        private firestore: Firestore,
        private store: Store,
    ) {}
}
