import {Action} from '@ngrx/store';
import {Filter} from '@data/filter';


export enum TagsFiltersTasksActionTypes {
    SetCurrentTagsFilters = '[TagsFiltersTasks] Set Current Tags Filter'
}

export class SetCurrentTagsFilters implements Action {
    readonly type = TagsFiltersTasksActionTypes.SetCurrentTagsFilters;
    constructor(public payload: {currentTagsFilter: Filter}) {}
}

export type TagsFiltersTasksActions = SetCurrentTagsFilters;
