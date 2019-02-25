import * as moment from 'moment';
import * as configurationActions from './actions/configuration';
import {stateActiveDateElement} from '../models/state-active-date-element.enum';
import {IActiveDateElement} from '../models/active-data-element.interface';


//
// export function detectApiError(state: any = false, action: configurationActions.Actions) {
//     switch (action.type) {
//         case configurationActions.UPDATE_DETECT_API_ERROR:
//             return action.payload;
//         default:
//             return state;
//     }
// }

// export function offlineModeNotification(state: any = false, action: configurationActions.Actions) {
//     switch (action.type) {
//         case configurationActions.UPDATE_OFFLINE_MODE_NOTIFICATION:
//             return action.payload;
//         default:
//             return state;
//     }
// }

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

export function rightSidenavVisibility(state: any = {
    'position': 'end',
    'mode': 'side',
    'open': true
}, action: configurationActions.Actions) {
    switch (action.type) {
        case configurationActions.UPDATE_RIGHT_SIDENAV_VISIBILITY:
            return Object.assign({}, state, action.payload);
        default:
            return state;
    }
}
