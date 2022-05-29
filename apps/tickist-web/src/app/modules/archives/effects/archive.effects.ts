import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { Store } from "@ngrx/store";
import { getArchivedTasks, saveToStore } from "../actions/archive.actions";
import { concatMap, map, switchMap, withLatestFrom } from "rxjs/operators";
import { selectLoggedInUser } from "../../../core/selectors/user.selectors";
import { combineLatest, forkJoin } from "rxjs";
import { Task } from "@data";
import {
    Firestore,
    doc,
    onSnapshot,
    DocumentReference,
    docSnapshots,
    collection,
    query,
    where,
    limit,
    orderBy,
    collectionData,
    sortedChanges,
    collectionChanges,
} from "@angular/fire/firestore";

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
                        where("isDone", "==", true)
                    );
                    console.log(collectionChanges(firebaseQuery));
                    return collectionChanges(firebaseQuery);
                }
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
            })
        )
    );

    constructor(private actions$: Actions, private firestore: Firestore, private store: Store) {}
}
