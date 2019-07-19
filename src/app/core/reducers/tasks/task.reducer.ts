import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {TaskActions, TaskActionTypes} from '../../actions/tasks/task.actions';
import {TickistActions, TickistActionTypes} from '../../../tickist.actions';
import {Task} from '../../../models/tasks';
import {setStatusDoneLogic} from '../../../single-task/utils/set-status-to-done-logic';
import {createDefaultLoadable, Loadable} from '../../utils/loadable/loadable';
import {withLoadable} from '../../utils/loadable/with-loadable';

export interface TasksState extends EntityState<Task>, Loadable {
    allTasksLoaded: boolean;

}



export const adapter: EntityAdapter<Task> =
    createEntityAdapter<Task>();


export const initialTasksState: TasksState = adapter.getInitialState({
    allTasksLoaded: false,
    ...createDefaultLoadable(),
});


export function baseReducer(state = initialTasksState, action: (TaskActions | TickistActions)): TasksState {
    switch (action.type) {
        case TaskActionTypes.CREATE_TASK:
            return adapter.addOne(action.payload.task, state);

        case TaskActionTypes.ADD_TASKS:
            return adapter.addAll(action.payload.tasks, {...state, allTasksLoaded: true});

        case TaskActionTypes.UPDATE_TASK:
            return adapter.updateOne(action.payload.task, state);

        case TaskActionTypes.DELETE_TASK:
            return adapter.removeOne(action.payload.taskId, state);

        case TaskActionTypes.CLOSE_MENU_IN_ALL_TASKS:
            return adapter.updateMany(action.payload.tasks, state);

        case TickistActionTypes.ResetStore:
            return initialTasksState;

        default:
            return state;
    }
}

export function reducer(state: TasksState, action: (TaskActions | TickistActions)): TasksState {
    return withLoadable(baseReducer, {
        loadingActionType: [TaskActionTypes.REQUEST_UPDATE_TASK, TaskActionTypes.REQUEST_ALL_TASKS],
        successActionType: [TaskActionTypes.UPDATE_TASK, TaskActionTypes.CREATE_TASK, TaskActionTypes.ADD_TASKS],
        errorActionType: [],
    })(state, action);
}

export const {
    selectAll,
    selectEntities,
    selectIds,
    selectTotal

} = adapter.getSelectors();
