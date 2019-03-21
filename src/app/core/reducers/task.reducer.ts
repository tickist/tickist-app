import {Task} from 'app/models/tasks';
import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {TaskActions, TaskActionTypes} from '../actions/task.actions';
import {TickistActions, TickistActionTypes} from '../../tickist.actions';

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

        case TaskActionTypes.DELETE_TASK:
            return adapter.removeOne(action.payload.taskId, state);

        case TaskActionTypes.CLOSE_MENU_IN_ALL_TASKS:
            return adapter.updateMany(action.payload.tasks,  state);

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
