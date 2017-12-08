import {Tag} from '../models/tags';
import * as tagActions from './actions/tags';


export function tags (state = [], action: tagActions.Actions) {
  let index: number;
  switch (action.type) {
    case tagActions.ADD_TAGS:
      return (<tagActions.AddTags>action).payload;
    case tagActions.CREATE_TAG:
      return [...state, action.payload];
    case tagActions.UPDATE_TAG:
      return state.map(tag => {
        return tag.id === (<tagActions.UpdateTag>action).payload.id ?  action.payload : tag;
      });
    case tagActions.DELETE_TAG:
      return state.filter(tag => {
        return tag.id !== (<tagActions.DeleteTag>action).payload.id;
      });
    default:
      return state;
  }
};
