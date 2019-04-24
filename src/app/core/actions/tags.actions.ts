import {Action} from '@ngrx/store';
import {Update} from '@ngrx/entity';
import {Tag} from '../../models/tags';

export enum TagActionTypes {
    REQUEST_ALL_TAGS = '[] REQUEST_ALL_TAGS',
    REQUEST_CREATE_TAG = '[] REQUEST_CREATE_TAG',
    REQUEST_UPDATE_TAG= '[] REQUEST_UPDATE TAG',
    REQUEST_DELETE_TAG = '[] REQUEST_DELETE_TAG',
    ADD_TAGS = '[] ADD_TAGS',
    CREATE_TAG = '[] CREATE_TAG',
    UPDATE_TAG = '[] UPDATE_TAG',
    DELETE_TAG = '[] DELETE_TAG'
}


export class RequestsAllTags implements Action {
    readonly type = TagActionTypes.REQUEST_ALL_TAGS;
}

export class RequestCreateTag implements Action {
    readonly type = TagActionTypes.REQUEST_CREATE_TAG;

    constructor(public payload: { tag: Tag }) {
    }
}

export class AddTags implements Action {
    readonly type = TagActionTypes.ADD_TAGS;

    constructor(public payload: { tags: Tag[] }) {
    }
}

export class CreateTag implements Action {
    readonly type = TagActionTypes.CREATE_TAG;

    constructor(public payload: { tag: Tag }) {
    }
}

export class UpdateTag implements Action {
    readonly type = TagActionTypes.UPDATE_TAG;

    constructor(public payload: { tag: Update<Tag> }) {
    }
}

export class DeleteTag implements Action {
    readonly type = TagActionTypes.DELETE_TAG;

    constructor(public payload: { tagId: number }) {
    }
}

export type TagActions = AddTags
    | DeleteTag
    | UpdateTag
    | CreateTag
    | RequestsAllTags
    | RequestCreateTag;
