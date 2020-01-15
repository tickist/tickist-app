import {Action} from '@ngrx/store';

export enum SearchTasksActionTypes {
    SetCurrrentSearchTasksFilter = '[SearchTasks] Set current search tasks filter'
}

export class SetCurrrentSearchTasksFilter implements Action {
    readonly type = SearchTasksActionTypes.SetCurrrentSearchTasksFilter;

    constructor(public payload: {searchText: string}) {}
}

export type SearchTasksActions = SetCurrrentSearchTasksFilter;
