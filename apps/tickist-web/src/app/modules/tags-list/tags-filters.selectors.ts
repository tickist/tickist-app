import {createFeatureSelector, createSelector} from '@ngrx/store';
import {TagsFiltersState} from './tags-filters.reducers';
import {selectAllTags} from '../../core/selectors/tags.selectors';
import * as _ from 'lodash';
import {selectAllUndoneTasks} from '../../core/selectors/task.selectors';
import {TagWithTaskCounter, calculateTasksCounterInTags} from '@data';


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
    selectAllUndoneTasks,
    (tags, filter, tasks): TagWithTaskCounter[] => {
        if (!filter) return [];
        const filteredTags = calculateTasksCounterInTags(tags, tasks).filter(Function(`return ${filter.value}`)());

        return <TagWithTaskCounter[]> _.orderBy(filteredTags, 'name', 'asc');

    }
);
