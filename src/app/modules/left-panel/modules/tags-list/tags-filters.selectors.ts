import {createFeatureSelector, createSelector} from '@ngrx/store';
import {TagsFiltersState} from './tags-filters.reducers';
import {selectAllTags} from '../../../../core/selectors/tags.selectors';
import {selectSortByState} from '../../../../core/selectors/sort-by-tasks.selectors';
import * as _ from 'lodash';
import {Tag} from '../../../../models/tags';



export const selectTagsFilters = createFeatureSelector<TagsFiltersState>('tagsFilters');

export const selectCurrentTagFilter = createSelector(
    selectTagsFilters,
    tagsFilters => tagsFilters.currentFilter
);

export const selectAllTagsFilters = createSelector(
    selectTagsFilters,
    tagsFilters => tagsFilters.filters
);

export const selectFilteredTagsList = createSelector(
    selectAllTags,
    selectCurrentTagFilter,
    (tags, filter): Tag[] => {
        // @TODO add filters 
        return tags;
        
        // if (!filter) return [];
        // const filteredTags = tags.filter(Function(`return ${filter.value}`)());
        //
        // return <Tag[]> _.orderBy(filteredTags, 'name', 'asc');

    }
);
