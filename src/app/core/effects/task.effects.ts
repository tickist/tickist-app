import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {catchError, filter, map, mapTo, mergeMap, switchMap, withLatestFrom} from 'rxjs/operators';
import {select, Store} from '@ngrx/store';
import {
    AddTasks,
    CloseMenuInAllTasks,
    CreateTask,
    DeleteTask,
    RequestCreateTask,
    RequestUpdateTask,
    TaskActionTypes,
    UpdateTask
} from '../actions/tasks/task.actions';
import {TaskService} from '../services/task.service';
import {AppStore} from '../../store';
import {selectAllTasks} from '../selectors/task.selectors';
import {Task} from '../../models/tasks/tasks';
import {ROUTER_NAVIGATED} from '@ngrx/router-store';
import {SwitchOnProgressBar} from '../actions/progress-bar.actions';
import {of} from 'rxjs';
import {QueryTags} from '../actions/tags.actions';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';


@Injectable()
export class TaskEffects {


    @Effect()
    queryTasks$ = this.actions$
        .pipe(
            ofType<QueryTags>(TaskActionTypes.QUERY_TASKS),
            switchMap(action => {
                console.log(action);
                return this.db.collection('tasks', ref => ref
                    .where('owner.id', '==', this.authFire.auth.currentUser.uid)
                    .where('status', '<', 1)
                   // .where('status', '>', 1)
                ).stateChanges();
            }),
            // mergeMap(action => action),
            map(actions => {
                // debugger;
                const addedTasks: Task[] = [];
                const deletedTasks: Task[] = [];
                const updatedTasks: Task[] = [];
                // action.payload.doc.data()
                console.log(actions);
                actions.forEach((action => {
                    if (action.type === 'added') {
                        const data: any = action.payload.doc.data();
                        addedTasks.push(new Task({
                            id: action.payload.doc.id,
                            ...data
                        }));
                    }
                }));
                return new AddTasks({tasks: addedTasks});
            })
        );

    // @Effect()
    // addTasks$ = this.actions$
    //     .pipe(
    //         ofType<RequestsAllTasks>(TaskActionTypes.REQUEST_ALL_TASKS),
    //         withLatestFrom(this.store.pipe(select(allTasksLoaded))),
    //         filter(([action, allTasksLoadedValue]) => !allTasksLoadedValue),
    //         mergeMap(() => this.tasksService.loadTasks()),
    //         map(tasks => new AddTasks({tasks: tasks}))
    //     );

    @Effect({dispatch: false})
    createTask$ = this.actions$
        .pipe(
            ofType<RequestCreateTask>(TaskActionTypes.REQUEST_CREATE_TASK),
            mergeMap(action => this.tasksService.createTask(action.payload.task)),
            catchError((error: any) => of(console.log(error)))
        );

    // @Effect()
    // updateTask$ = this.actions$
    //     .pipe(
    //         ofType<UpdateTask | SetTaskStatusToDone>(TaskActionTypes.UPDATE_TASK, TaskActionTypes.SET_TASK_STATUS_TO_DONE),
    //         mergeMap((action) => this.tasksService.updateTask(<Task> action.payload.task.changes)),
    //         mapTo(new SwitchOffProgressBar())
    //     );


    @Effect({dispatch: false})
    updateTask$ = this.actions$
        .pipe(
            ofType<RequestUpdateTask>(TaskActionTypes.REQUEST_UPDATE_TASK),
            mergeMap((action) => this.tasksService.updateTask(<Task> action.payload.task.changes)),
            catchError((error: any) => of(console.log(error)))
        );

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
            ofType<DeleteTask>(TaskActionTypes.DELETE_TASK),
            mergeMap(action => this.tasksService.deleteTask(action.payload.taskId))
        );

    @Effect()
    closeMenuInTaskDuringRouterNavigator = this.actions$
        .pipe(
            ofType(ROUTER_NAVIGATED),
            withLatestFrom(this.store.pipe(select(selectAllTasks))),
            map(([action, tasks]) => {
                const tasksWithCloseMenu = tasks.map(task => {
                    return  {
                        id: task.id,
                        changes: <Partial<Task>> {
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
                private store: Store<AppStore>, private authFire: AngularFireAuth) {

    }

}

