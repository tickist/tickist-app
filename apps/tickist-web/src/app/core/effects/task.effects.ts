import {Injectable} from '@angular/core';
import {Actions, createEffect, Effect, ofType} from '@ngrx/effects';
import {catchError, concatMap, filter, map, mapTo, mergeMap, switchMap, tap, withLatestFrom} from 'rxjs/operators';
import {select, Store} from '@ngrx/store';
import {
    AddTasks,
    CloseMenuInAllTasks,
    DeleteTask,
    RequestCreateTask,
    RequestDeleteTask,
    RequestUpdateTask,
    SetStatusDone,
    TaskActionTypes,
    UpdateTask
} from '../actions/tasks/task.actions';
import {TaskService} from '../services/task.service';
import {AppStore} from '../../store';
import {selectAllTasks} from '../selectors/task.selectors';
import {Task} from '@data/tasks/models/tasks';
import {ROUTER_NAVIGATED} from '@ngrx/router-store';
import {SwitchOnProgressBar} from '../actions/progress-bar.actions';
import {of} from 'rxjs';
import {QueryTags} from '../actions/tags.actions';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';
import {Update} from '@ngrx/entity';
import { MatSnackBar } from '@angular/material/snack-bar';
import {selectLoggedInUser} from '../selectors/user.selectors';


@Injectable()
export class TaskEffects {


    @Effect()
    queryTasks$ = this.actions$
        .pipe(
            ofType<QueryTags>(TaskActionTypes.QUERY_TASKS),
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
                    returnsActions.push(new AddTasks({tasks: addedTasks}));
                }
                if (updatedTask) {
                    returnsActions.push(new UpdateTask({task: updatedTask}));
                }
                if (deletedTaskId) {
                    returnsActions.push(new DeleteTask({taskId: deletedTaskId}));
                }
                return returnsActions;
            })
        );

    @Effect({dispatch: false})
    createTask$ = this.actions$
        .pipe(
            ofType<RequestCreateTask>(TaskActionTypes.REQUEST_CREATE_TASK),
            withLatestFrom(this.store.select(selectLoggedInUser)),
            mergeMap(([action, user]) => this.tasksService.createTask(action.payload.task, user)),
        );

    @Effect({dispatch: false})
    updateTask$ = this.actions$
        .pipe(
            ofType<RequestUpdateTask>(TaskActionTypes.REQUEST_UPDATE_TASK),
            withLatestFrom(this.store.select(selectLoggedInUser)),
            mergeMap(([action, user]) => this.tasksService.updateTask(<Task>action.payload.task.changes, user)),
        );

    setStatusDone$ = createEffect(() => this.actions$
        .pipe(
            ofType<SetStatusDone>(TaskActionTypes.SET_STATUS_DONE),
            withLatestFrom(this.store.select(selectLoggedInUser)),
            mergeMap(([action, user]) => this.tasksService.setStatusDone(<Task>action.payload.task.changes, user)),
            tap(() => this.snackBar.open('Task is done. Great job!', '', {
                duration: 2000,
            }))
        ), {dispatch: false});

    @Effect()
    progressBar$ = this.actions$
        .pipe(
            ofType<RequestUpdateTask>(TaskActionTypes.REQUEST_UPDATE_TASK),
            filter(action => action.payload.progressBar),
            mapTo(new SwitchOnProgressBar())
        );

    @Effect({dispatch: false})
    deleteTask$ = this.actions$
        .pipe(
            ofType<RequestDeleteTask>(TaskActionTypes.REQUEST_REQUEST_TASK),
            mergeMap(action => this.tasksService.deleteTask(action.payload.taskId)),
            tap(() => this.snackBar.open('Task has been deleted successfully', '', {
                duration: 2000,
            }))
        );

    @Effect()
    closeMenuInTaskDuringRouterNavigator = this.actions$
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
                return new CloseMenuInAllTasks({tasks: tasksWithCloseMenu});
            })
        );

    constructor(private actions$: Actions, private tasksService: TaskService, private db: AngularFirestore,
                private store: Store, private authFire: AngularFireAuth, public snackBar: MatSnackBar) {

    }

}

