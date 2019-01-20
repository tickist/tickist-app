
import * as tasksActions from './actions/tasks';



export function currentTasksFilters(state = [], action: tasksActions.Actions) {

    switch (action.type) {
        case tasksActions.ADD_CURRENT_FILTERS:
            return action.payload;
        case tasksActions.UPDATE_CURRENT_FILTER:
            return state.map(elem => {
                return elem.label === (<tasksActions.UpdateCurrentFilter>action).payload.label
                    ? action.payload : elem;
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



