import {Injectable} from "@angular/core";
import {Actions, createEffect, ofType} from "@ngrx/effects";
import {AngularFirestore} from "@angular/fire/firestore";
import {Store} from "@ngrx/store";
import {getArchivedTasks, saveToStore} from "../actions/archive.actions";
import {map, switchMap, withLatestFrom} from "rxjs/operators";
import {selectLoggedInUser} from "../../../core/selectors/user.selectors";
import {combineLatest, forkJoin} from "rxjs";
import { Task } from "@data";

@Injectable()
export class ArchiveEffects {

    queryArchivedTasks$ = createEffect(() => this.actions$
        .pipe(
            ofType(getArchivedTasks),
            switchMap(({projectId, userId}) => this.db.collection(
                    'tasks',
                    ref => ref
                        .where('isActive', '==', true)
                        .where('taskProject.shareWithIds', 'array-contains', userId)
                        .where('taskProject.id', '==', projectId)
                        .where('isDone', '==', true)
                ).valueChanges()),
            map(tasks => saveToStore({archivedTasks: tasks as any}))
        )
    )

    constructor(private actions$: Actions, private db: AngularFirestore, private store: Store) {

    }
}
