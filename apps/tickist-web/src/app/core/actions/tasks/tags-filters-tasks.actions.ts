import {Action} from '@ngrx/store';
import {Filter} from '../../../../../../../libs/data/src/lib/filter';

export enum TagsFiltersTasksActionTypes {
    SetCurrentTagsFilters = '[TagsFiltersTasks] Set Current Tags Filter'
}

export class SetCurrentTagsFilters implements Action {
    readonly type = TagsFiltersTasksActionTypes.SetCurrentTagsFilters;
    constructor(public payload: {currentTagsFilter: Filter}) {}
}

export type TagsFiltersTasksActions = SetCurrentTagsFilters;