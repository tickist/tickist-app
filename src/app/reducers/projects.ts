import {Project} from '../models/projects';
import * as projectsActions from './actions/projects';




// export function selectedProject(state: any = null, action: projectsActions.SelectProjectActions) {
//     switch (action.type) {
//         case projectsActions.SELECT_PROJECT:
//             return action.payload;
//         default:
//             return state;
//     }
// }

// export function selectedProjectsIds(state: any = [], action: projectsActions.SelectedProjectsIdsActions) {
//     switch (action.type) {
//         case projectsActions.NEW_IDS:
//             return action.payload;
//         case projectsActions.ADD_NEW_ID:
//             return [...state, action.payload];
//         case projectsActions.DELETE_ID:
//             const index = state.indexOf(action.payload);
//             return [
//                 ...state.slice(0, index),
//                 ...state.slice(index + 1)
//             ];
//         default:
//             return state;
//     }
// }

export function currentProjectsFilters(state = null, action: projectsActions.CurrentProjectsFilters) {

    switch (action.type) {
        case projectsActions.ADD_CURRENT_FILTERS:
            return action.payload;
        case projectsActions.UPDATE_CURRENT_FILTER:
            return action.payload;
        default:
            return state;
    }
}


export function projectsFilters(state = [], action: projectsActions.ProjectsFilters) {

    switch (action.type) {
        case projectsActions.ADD_FILTERS:
            return action.payload;
        case projectsActions.UPDATE_FILTERS:
            return state.map(elem => {
                return elem.label === (<projectsActions.UpdateFilters>action).payload.label ? Object.assign({}, elem, action.payload) : elem;
            });
        default:
            return state;
    }
}
