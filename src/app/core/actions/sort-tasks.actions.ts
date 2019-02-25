import {Action} from '@ngrx/store';
import {SortBy} from '../../tasks/models/sortBy';

export enum SortTasksActionTypes {
    AddSortByOptions = '[SortTasks] Add sort by options',
    SetCurrentSortBy = '[SortTasks] Set current sortby'


}

export class AddSortByOptions implements Action {
    readonly type = SortTasksActionTypes.AddSortByOptions;

    constructor(public payload: {sortByOptions: SortBy[]}) {}
}

export class SetCurrentSortBy implements Action {
    readonly type = SortTasksActionTypes.SetCurrentSortBy;

    constructor(public payload: {currentSortBy: SortBy}) {}
}


export type SortTasksActions = AddSortByOptions | SetCurrentSortBy;
