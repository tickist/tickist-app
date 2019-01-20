import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {filter, map, mergeMap, withLatestFrom} from 'rxjs/operators';
import {select, Store} from '@ngrx/store';
import {AddTags, CreateTag, DeleteTag, RequestCreateTag, RequestsAllTags, TagActionTypes, UpdateTag} from './tags.actions';
import {AppStore} from '../store';
import {allTagsLoaded, selectTagById} from './tags.selectors';
import {Tag} from '../models/tags';
import {Update} from '@ngrx/entity';
import {TagService} from '../services/tag.service';


@Injectable()
export class TagsEffects {

    @Effect()
    addTags$ = this.actions$
        .pipe(
            ofType<RequestsAllTags>(TagActionTypes.REQUEST_ALL_TAGS),
            withLatestFrom(this.store.pipe(select(allTagsLoaded))),
            filter(([action, allTagsLoadedValue]) => !allTagsLoadedValue),
            mergeMap(() => this.tagsService.loadTags()),
            map(tags => new AddTags({tags: tags}))
        );

    @Effect()
    createTag$ = this.actions$
        .pipe(
            ofType<RequestCreateTag>(TagActionTypes.REQUEST_CREATE_TAG),
            mergeMap(action => this.tagsService.createTag(action.payload.tag)),
            map(payload => new CreateTag({tag: payload}))
        );

    @Effect({dispatch: false})
    updateTag$ = this.actions$
        .pipe(
            ofType<UpdateTag>(TagActionTypes.UPDATE_TAG),
            mergeMap((action) => this.store.select(selectTagById(<number> action.payload.tag.id))),
            mergeMap((tag: Tag, index: number) => this.tagsService.updateTag(tag))
        );

    @Effect({dispatch: false})
    deleteTag$ = this.actions$
        .pipe(
            ofType<DeleteTag>(TagActionTypes.DELETE_TAG),
            mergeMap(action => this.tagsService.deleteTag(action.payload.tagId))
        );

    constructor(private actions$: Actions, private tagsService: TagService,
                private store: Store<AppStore>) {

    }

}

