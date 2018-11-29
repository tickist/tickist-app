import {Task} from '../models/tasks';
import * as tasksActions from './actions/tasks';


export function tasks(state = [], action: tasksActions.Actions) {

    switch (action.type) {
        case tasksActions.ADD_TASKS:
            return (<tasksActions.AddTasks>action).payload;
        case tasksActions.CREATE_TASK:
            return [...state, action.payload];
        case tasksActions.UPDATE_TASK:
            return state.map(task => {
                return task.id === (<tasksActions.UpdateTask>action).payload.id ? action.payload : task;
            });
        case tasksActions.DELETE_TASK:
            return state.filter(task => {
                return !(task.id === (<tasksActions.DeleteTask>action).payload.id);
            });
        case tasksActions.CLOSE_MENU_IN_TASKS:
            return state.map(task => {
                task.menuShowing.hideAllMenuElements();
                return task;
            });
        default:
            return state;
    }
}

export function currentTasksFilters(state = [], action: tasksActions.Actions) {

    switch (action.type) {
        case tasksActions.ADD_CURRENT_FILTERS:
            return action.payload;
        case tasksActions.UPDATE_CURRENT_FILTER:
            return state.map(elem => {
                return elem.label === (<tasksActions.UpdateCurrentFilter>action).payload.label
                    ? Object.assign({}, elem, action.payload) : elem;
            });
        default:
            return state;
    }
}

export function tasksFilters(state = [], action: tasksActions.Actions) {

    switch (action.type) {
        case tasksActions.ADD_FILTERS:
            return action.payload;
        case tasksActions.DELETE_NON_FIXED_ASSIGNED_TO:
            return state.filter(elem => {
                return elem.label !== 'assignedTo' || elem.fixed;
            });
        case tasksActions.ADD_NEW_ASSIGNED_TO:
            return [...state, action.payload];
        case tasksActions.UPDATE_FILTERS:
            return state.map(elem => {
                return elem.label === (<tasksActions.UpdateFilters>action).payload.label ? Object.assign({}, elem, action.payload) : elem;
            });
        default:
            return state;
    }
}

export function currentTasksFutureFilters(state = [], action: tasksActions.Actions) {

    switch (action.type) {
        case tasksActions.ADD_CURRENT_FUTURE_TASKS_FILTERS:
            return action.payload;
        case tasksActions.UPDATE_CURRENT_FUTURE_TASKS_FILTER:
            return action.payload;
        default:
            return state;
    }
}

export function futureTasksFilters(state = [], action: tasksActions.Actions) {

    switch (action.type) {
        case tasksActions.ADD_FUTURE_TASKS_FILTERS:
            return action.payload;
        case tasksActions.UPDATE_FUTURE_TASKS_FILTERS:
            return state.map(elem => {
                return elem.label === (<tasksActions.UpdateFutureTasksFilters>action).payload.label
                    ? Object.assign({}, elem, action.payload) : elem;
            });
        default:
            return state;
    }
}



