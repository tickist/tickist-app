import {Action} from '@ngrx/store';
import {Filter} from '@data/filter';



export enum TagsFiltersActionTypes {
    AddTagsFilters = '[Tags Filters] Add tags filters',
    SetCurrentTagsListFilter = '[Tags Filters] Set current tags list filter'
}

export class AddTagsFilters implements Action {
    readonly type = TagsFiltersActionTypes.AddTagsFilters;

    constructor(public payload: {filters: Filter[]}) {}
}

export class SetCurrentTagsListFilter implements Action {
    readonly type = TagsFiltersActionTypes.SetCurrentTagsListFilter;

    constructor(public payload: {currentFilter: Filter}) {}
}

export type TagsFiltersActions = AddTagsFilters |  SetCurrentTagsListFilter;
