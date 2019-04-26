//
// import * as projectsActions from './actions/projects';
//
//
// export function currentProjectsFilters(state = null, action: projectsActions.CurrentProjectsFilters) {
//
//     switch (action.type) {
//         case projectsActions.ADD_CURRENT_FILTERS:
//             return action.payload;
//         case projectsActions.UPDATE_CURRENT_FILTER:
//             return action.payload;
//         default:
//             return state;
//     }
// }
//
//
// export function projectsFilters(state = [], action: projectsActions.ProjectsFilters) {
//
//     switch (action.type) {
//         case projectsActions.ADD_FILTERS:
//             return action.payload;
//         case projectsActions.UPDATE_FILTERS:
//             return state.map(elem => {
//                 return elem.label === (<projectsActions.UpdateFilters>action).payload.label ?
//                     Object.assign({}, elem, action.payload) : elem;
//             });
//         default:
//             return state;
//     }
// }
