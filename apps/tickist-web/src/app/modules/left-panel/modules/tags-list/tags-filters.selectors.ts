import {createFeatureSelector, createSelector} from '@ngrx/store';
import {TagsFiltersState} from './tags-filters.reducers';
import {selectAllTags} from '../../../../core/selectors/tags.selectors';
import {selectSortByState} from '../../../../core/selectors/sort-by-tasks.selectors';
import * as _ from 'lodash';
import {Tag} from '../../../../../../../../libs/data/src/lib/tags/models/tags';
import {selectAllUndoneTasks} from '../../../../core/selectors/task.selectors';
import {TagWithTaskCounter} from '../../../../../../../../libs/data/src/lib/tags/models/tag-with-task-counter';
import {calculateTasksCounterInTags} from '../../../../core/utils/tags-utlis';



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
