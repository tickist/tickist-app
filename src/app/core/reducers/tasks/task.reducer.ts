import {createEntityAdapter, EntityAdapter, EntityState, Update} from '@ngrx/entity';
import {TaskActions, TaskActionTypes} from '../../actions/tasks/task.actions';
import {TickistActions, TickistActionTypes} from '../../../tickist.actions';
import {Task} from '../../../models/tasks';
import {setStatusDoneLogic} from '../../../single-task/utils/set-status-to-done-logic';

export interface TasksState extends EntityState<Task> {

    allTasksLoaded: boolean;

}

export const adapter: EntityAdapter<Task> =
    createEntityAdapter<Task>();


export const initialTasksState: TasksState = adapter.getInitialState({
    allTasksLoaded: false
});


export function reducer(state = initialTasksState, action: (TaskActions | TickistActions)): TasksState {
    switch (action.type) {
        case TaskActionTypes.CREATE_TASK:
            return adapter.addOne(action.payload.task, state);

        case TaskActionTypes.ADD_TASKS:
            return adapter.addAll(action.payload.tasks, {...state, allTasksLoaded: true});

        case TaskActionTypes.UPDATE_TASK:
            return adapter.updateOne(action.payload.task, state);

        case TaskActionTypes.SET_TASK_STATUS_TO_DONE:
            const task = setStatusDoneLogic(action.payload.task.changes);
            return adapter.updateOne({id: task.id, changes: task}, state);

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

export const {
    selectAll,
    selectEntities,
    selectIds,
    selectTotal

} = adapter.getSelectors();
