import {createAction, props} from '@ngrx/store';
import {Filter} from '@data/filter';


export const setCurrentTagsFilters = createAction(
    '[TagsFiltersTasks] Set Current Tags Filter',
    props<{currentTagsFilter: Filter}>()
)

