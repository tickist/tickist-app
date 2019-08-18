import * as configurationActions from './actions/configuration';


export function addTaskComponentVisibility(state: any = true, action: configurationActions.Actions) {
    switch (action.type) {
        case configurationActions.UPDATE_ADD_TASK_VISIBILITY:
            return action.payload;
        default:
            return state;
    }
}



export function leftSidenavVisibility(state: any = {
    'position': 'start',
    'mode': 'side',
    'open': true
}, action: configurationActions.Actions) {
    switch (action.type) {
        case configurationActions.UPDATE_LEFT_SIDENAV_VISIBILITY:
            return Object.assign({}, state, action.payload);
        default:
            return state;
    }
}

