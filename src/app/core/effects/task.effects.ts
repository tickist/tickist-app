import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {catchError, concatMap, filter, map, mapTo, mergeMap, withLatestFrom} from 'rxjs/operators';
import {select, Store} from '@ngrx/store';
import {
    AddTasks,
    CloseMenuInAllTasks,
    CreateTask,
    DeleteTask,
    RequestCreateTask,
    RequestsAllTasks, RequestUpdateTask,
    TaskActionTypes,
    UpdateTask
} from '../actions/tasks/task.actions';
import {TaskService} from '../services/task.service';
import {AppStore} from '../../store';
import {allTasksLoaded, selectAllTasks, selectTaskById} from '../selectors/task.selectors';
import {Task} from '../../models/tasks';
import {ROUTER_NAVIGATED} from '@ngrx/router-store';
import {SwitchOffProgressBar, SwitchOnProgressBar} from '../actions/progress-bar.actions';
import {repeatTaskLogic} from '../../single-task/utils/set-status-to-done-logic';
import {of} from 'rxjs';



@Injectable()
export class TaskEffects {

    @Effect()
    addTasks$ = this.actions$
        .pipe(
            ofType<RequestsAllTasks>(TaskActionTypes.REQUEST_ALL_TASKS),
            withLatestFrom(this.store.pipe(select(allTasksLoaded))),
            filter(([action, allTasksLoadedValue]) => !allTasksLoadedValue),
            mergeMap(() => this.tasksService.loadTasks()),
            map(tasks => new AddTasks({tasks: tasks}))
        );

    @Effect()
    createTask$ = this.actions$
        .pipe(
            ofType<RequestCreateTask>(TaskActionTypes.REQUEST_CREATE_TASK),
            mergeMap(action => this.tasksService.createTask(action.payload.task)),
            map(payload => new CreateTask({task: payload}))
        );

    // @Effect()
    // updateTask$ = this.actions$
    //     .pipe(
    //         ofType<UpdateTask | SetTaskStatusToDone>(TaskActionTypes.UPDATE_TASK, TaskActionTypes.SET_TASK_STATUS_TO_DONE),
    //         mergeMap((action) => this.tasksService.updateTask(<Task> action.payload.task.changes)),
    //         mapTo(new SwitchOffProgressBar())
    //     );


    @Effect()
    updateTask$ = this.actions$
        .pipe(
            ofType<RequestUpdateTask>(TaskActionTypes.REQUEST_UPDATE_TASK),
            mergeMap((action) => this.tasksService.updateTask(<Task> action.payload.task.changes).pipe(
                map((task) => {
                    console.log(task);
                    return new UpdateTask({task: {id: task.id, changes: task}});
                }),
                catchError((error: any) => of(console.log(error)))
            ))
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

    constructor(private actions$: Actions, private tasksService: TaskService,
                private store: Store<AppStore>) {

    }

}

