import {Action, createAction, props} from '@ngrx/store';
import {Update} from '@ngrx/entity';
import {Tag} from '@data/tags/models/tags';


export const queryTags= createAction(
    '[TAGS] QUERY TAGS'
)

export const requestsAllTags = createAction(
    '[Tags] REQUEST_ALL_TAGS'
)

export const requestCreateTag = createAction(
    '[Tags] REQUEST_CREATE_TAG',
    props<{ tag: Tag }>()
)

export const addTags = createAction(
    '[Tags] ADD_TAGS',
    props<{ tags: Tag[] }>()
)

export const createTag = createAction(
    '[Tags] CREATE_TAG',
    props<{ tag: Tag }>()

)

export const updateTag = createAction(
    '[Tags] UPDATE_TAG',
    props<{ tag: Update<Tag>}>()
)

export const requestUpdateTag = createAction(
    '[Tags] REQUEST_UPDATE TAG',
    props<{ tag: Update<Tag> }>()
)

export const deleteTag = createAction(
    '[Tags] DELETE_TAG',
    props<{ tagId: string }>()
)

export const requestDeleteTag = createAction(
    '[Tags] REQUEST_DELETE_TAG',
    props<{ tagId: string }>()
)

