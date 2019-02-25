import {createFeatureSelector, createSelector} from '@ngrx/store';
import {TagsState} from '../reducers/tags.reducer';
import * as fromCourse from '../reducers/tags.reducer';


export const selectTagsState = createFeatureSelector<TagsState>('tags');

export const allTagsLoaded = createSelector(
    selectTagsState,
    tagsState => tagsState.allTagsLoaded
);

export const selectTagById = (tagId: number) => createSelector(
    selectTagsState,
    tagsState => tagsState.entities[tagId]
);

export const selectAllTags = createSelector(
    selectTagsState,
    fromCourse.selectAll

);

