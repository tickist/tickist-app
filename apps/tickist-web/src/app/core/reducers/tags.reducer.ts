
import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {TagActions, TagActionTypes} from '../actions/tags.actions';
import {Tag} from '../../models/tags/tags';


export interface TagsState extends EntityState<Tag> {

    allTagsLoaded: boolean;

}

export const adapter: EntityAdapter<Tag> =
    createEntityAdapter<Tag>();


export const initialTagsState: TagsState = adapter.getInitialState({
    allTagsLoaded: false
});


export function reducer(state = initialTagsState, action: TagActions): TagsState {
    switch (action.type) {
        case TagActionTypes.CREATE_TAG:
            return adapter.addOne(action.payload.tag, state);

        case TagActionTypes.ADD_TAGS:
            return adapter.addMany(action.payload.tags, {...state, allTagsLoaded: true});

        case TagActionTypes.UPDATE_TAG:
            return adapter.updateOne(action.payload.tag, state);

        case TagActionTypes.DELETE_TAG:
            return adapter.removeOne(action.payload.tagId, state);

        default:
            return state;
    }
}

export const {
    selectAll,
    selectEntities,
    selectIds,
    selectTotal

} = adapter.getSelectors();
