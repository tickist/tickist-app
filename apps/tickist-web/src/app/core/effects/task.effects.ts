import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {concatMap, filter, map, mapTo, mergeMap, switchMap, tap, withLatestFrom} from 'rxjs/operators';
import {select, Store} from '@ngrx/store';
import {
    addTasks,
    closeMenuInAllTasks,
    deleteTask,
    queryTasks,
    requestCreateTask,
    requestDeleteTask,
    requestUpdateTask,
    setStatusDone,
    updateTask
} from '../actions/tasks/task.actions';
import {TaskService} from '../services/task.service';
import {selectAllTasks} from '../selectors/task.selectors';
import {Task} from '@data/tasks/models/tasks';
import {ROUTER_NAVIGATED} from '@ngrx/router-store';
import {AngularFirestore} from '@angular/fire/firestore';
import {Update} from '@ngrx/entity';
import {MatSnackBar} from '@angular/material/snack-bar';
import {selectLoggedInUser} from '../selectors/user.selectors';
import {switchOnProgressBar} from "../actions/progress-bar.actions";


@Injectable()
export class TaskEffects {

    queryTasks$ = createEffect(() => this.actions$
        .pipe(
            ofType(queryTasks),
            withLatestFrom(this.store.select(selectLoggedInUser)),
            switchMap(([action, user]) => {
                console.log(action);
                console.log({user});
                return this.db.collection('tasks', ref => ref
                    .where('taskProject.shareWithIds', 'array-contains', user.id)
                    .where('isActive', '==', true)
                    .where('isDone', '==', false)
                ).stateChanges();
            }),
            concatMap(actions => {
                const addedTasks: Task[] = [];
                let deletedTaskId: string;
                let updatedTask: Update<Task>;
                console.log(actions);
                actions.forEach((action => {
                    if (action.type === 'added') {
                        const data: any = action.payload.doc.data();
                        addedTasks.push(new Task({
                            id: action.payload.doc.id,
                            ...data
                        }));
                    }
                    if (action.type === 'modified') {
                        const data: any = action.payload.doc.data();
                        updatedTask = {
                            id: action.payload.doc.id,
                            changes: new Task({...data})
                        };
                    }
                    if (action.type === 'removed') {
                        const data: any = action.payload.doc.data();
                        deletedTaskId = action.payload.doc.id;
                    }
                }));
                const returnsActions = [];
                if (addedTasks.length > 0) {
                    returnsActions.push(addTasks({tasks: addedTasks}));
                }
                if (updatedTask) {
                    returnsActions.push(updateTask({task: updatedTask}));
                }
                if (deletedTaskId) {
                    returnsActions.push(deleteTask({taskId: deletedTaskId}));
                }
                return returnsActions;
            })
        ));

    createTask$ = createEffect(() => this.actions$
        .pipe(
            ofType(requestCreateTask),
            withLatestFrom(this.store.select(selectLoggedInUser)),
            mergeMap(([action, user]) => this.tasksService.createTask(action.task, user)),
            tap(() => this.snackBar.open('Task has been created successfully', '', {
                duration: 2000,
            }))
        ), {dispatch: false});

    updateTask$ = createEffect(() => this.actions$
        .pipe(
            ofType(requestUpdateTask),
            withLatestFrom(this.store.select(selectLoggedInUser)),
            mergeMap(([action, user]) => this.tasksService.updateTask(<Task>action.task.changes, user)),
            tap(() => this.snackBar.open('Task has been updated successfully', '', {
                duration: 2000,
            }))
        ), {dispatch: false});

    setStatusDone$ = createEffect(() => this.actions$
        .pipe(
            ofType(setStatusDone),
            withLatestFrom(this.store.select(selectLoggedInUser)),
            mergeMap(([action, user]) => this.tasksService.setStatusDone(<Task>action.task.changes, user)),
            tap(() => this.snackBar.open('Task is done. Great job!', '', {
                duration: 2000,
            }))
        ), {dispatch: false});

    progressBar$ = createEffect(() => this.actions$
        .pipe(
            ofType(requestUpdateTask),
            filter(action => action.progressBar),
            mapTo(switchOnProgressBar())
        ))

    deleteTask$ = createEffect(() => this.actions$
        .pipe(
            ofType(requestDeleteTask),
            mergeMap(action => this.tasksService.deleteTask(action.taskId)),
            tap(() => this.snackBar.open('Task has been deleted successfully', '', {
                duration: 2000,
            }))
        ), {dispatch: false});

    closeMenuInTaskDuringRouterNavigator$ = createEffect(() => this.actions$
        .pipe(
            ofType(ROUTER_NAVIGATED),
            withLatestFrom(this.store.pipe(select(selectAllTasks))),
            map(([action, tasks]) => {
                const tasksWithCloseMenu = tasks.map(task => {
                    return {
                        id: task.id,
                        changes: <Partial<Task>>{
                            menuShowing: {
                                isFinishDate: false,
                                isTaskProject: false,
                                isAssignedTo: false,
                                isRepeat: false,
                                isTags: false,
                                isSteps: false,
                                isDescription: false
                            }
                        }
                    };
                });
                return closeMenuInAllTasks({tasks: tasksWithCloseMenu});
            })
        ));

    constructor(private actions$: Actions, private tasksService: TaskService, private db: AngularFirestore,
                private store: Store, public snackBar: MatSnackBar) {

    }

}

