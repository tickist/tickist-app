import * as tagActions from './actions/tags';
import * as projectsActions from './actions/projects';


export function tags(state = [], action: tagActions.Actions) {
    let index: number;
    switch (action.type) {
        case tagActions.ADD_TAGS:
            return (<tagActions.AddTags>action).payload;
        case tagActions.CREATE_TAG:
            return [...state, action.payload];
        case tagActions.UPDATE_TAG:
            return state.map(tag => {
                return tag.id === (<tagActions.UpdateTag>action).payload.id ? action.payload : tag;
            });
        case tagActions.DELETE_TAG:
            return state.filter(tag => {
                return tag.id !== (<tagActions.DeleteTag>action).payload.id;
            });
        default:
            return state;
    }
}


export function currentTagsFilters(state = [], action: tagActions.CurrentTagsFilters) {

    switch (action.type) {
        case tagActions.ADD_CURRENT_FILTERS:
            return action.payload;
        case tagActions.UPDATE_CURRENT_FILTER:
            return action.payload;
        default:
            return state;
    }
}


export function tagsFilters(state = [], action: tagActions.TagsFilters) {

    switch (action.type) {
        case tagActions.ADD_FILTERS:
            return action.payload;
        case tagActions.UPDATE_FILTERS:
            return state.map(elem => {
                return elem.label === (<tagActions.UpdateFilters>action).payload.label ? Object.assign({}, elem, action.payload) : elem;
            });
        default:
            return state;
    }
}
