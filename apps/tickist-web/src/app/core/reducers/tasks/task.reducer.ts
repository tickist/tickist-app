import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {
    addTasks,
    closeMenuInAllTasks,
    createTask,
    deleteTask, requestsAllTasks, requestUpdateTask,
    updateTask
} from '../../actions/tasks/task.actions';
import {resetStore} from '../../../tickist.actions';
import {Task} from '@data/tasks/models/tasks';
import {createDefaultLoadable, Loadable} from '../../utils/loadable/loadable';
import {withLoadable} from '../../utils/loadable/with-loadable';
import {Action, createReducer, on} from "@ngrx/store";

export interface TasksState extends EntityState<Task>, Loadable {
    allTasksLoaded: boolean;
}

export const adapter: EntityAdapter<Task> =
    createEntityAdapter<Task>();


export const initialTasksState: TasksState = adapter.getInitialState({
    allTasksLoaded: false,
    ...createDefaultLoadable(),
});

const taskReducer = createReducer(
    initialTasksState,
    on(createTask, (state, props) => adapter.addOne(props.task, state)),
    on(addTasks, (state, props) => adapter.addMany(props.tasks, {...state, allTasksLoaded: true})),
    on(updateTask, (state, props) => adapter.updateOne(props.task, state)),
    on(deleteTask, (state, props) => adapter.removeOne(props.taskId, state)),
    on(closeMenuInAllTasks, (state, props) => adapter.updateMany(props.tasks, state)),
    on(resetStore, (state, props) => initialTasksState),
)

export function reducer(state: TasksState, action: Action) {
    return taskReducer(state, action)
}


export const {
    selectAll,
    selectEntities,
    selectIds,
    selectTotal

} = adapter.getSelectors();
