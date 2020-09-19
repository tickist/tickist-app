import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {addTags, createTag, deleteTag, updateTag} from '../actions/tags.actions';
import {Tag} from '@data/tags/models/tags';
import {Action, createReducer, on} from "@ngrx/store";
import {resetStore} from "../../tickist.actions";


export interface TagsState extends EntityState<Tag> {

    allTagsLoaded: boolean;

}

export const adapter: EntityAdapter<Tag> =
    createEntityAdapter<Tag>();


export const initialTagsState: TagsState = adapter.getInitialState({
    allTagsLoaded: false
});

const tagsReducer = createReducer(
    initialTagsState,
    on(createTag, (state, props) => {
        return adapter.addOne(props.tag, state);
    }),
    on(addTags, (state, props) => {
        return adapter.addMany(props.tags, {...state, allTagsLoaded: true});
    }),
    on(updateTag, (state, props) => {
        return adapter.updateOne(props.tag, state);
    }),
    on(deleteTag, (state, props) => {
        return adapter.removeOne(props.tagId, state);
    }),
    on(resetStore, (state, props) => {
        return initialTagsState
    }),
)

export function reducer(state: TagsState, action: Action) {
    return tagsReducer(state, action);
}

export const {
    selectAll,
    selectEntities,
    selectIds,
    selectTotal

} = adapter.getSelectors();
