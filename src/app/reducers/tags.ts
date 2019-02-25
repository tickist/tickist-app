// import * as tagActions from '../modules/left-panel/modules/tags-list/tags-filters.actions';
// import {Tag} from '../models/tags';
//
// export function currentTagsFilters(state = null, action: tagActions.CurrentTagsFilters) {
//
//     switch (action.type) {
//         case tagActions.ADD_CURRENT_FILTERS:
//             return action.payload;
//         case tagActions.UPDATE_CURRENT_FILTER:
//             return action.payload;
//         default:
//             return state;
//     }
// }
//
//
// export function tagsFilters(state = [], action: tagActions.TagsFilters) {
//
//     switch (action.type) {
//         case tagActions.ADD_FILTERS:
//             return action.payload;
//         case tagActions.UPDATE_FILTERS:
//             return state.map(elem => {
//                 return elem.label === (<tagActions.UpdateFilters>action).payload.label ? Object.assign({}, elem, action.payload) : elem;
//             });
//         default:
//             return state;
//     }
// }
