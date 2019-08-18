import {Action} from '@ngrx/store';
import {Filter} from '../../../../../../../libs/data/src/lib/filter';


export enum AssignedToFiltersTasksActionTypes {
    AddNewAssignedToFilter = '[AssignedToFiltersTasks] Add new assigned to filters',
    SetCurrentAssingedToFilter = '[AssignedToFiltersTasks] Set current assigned to filters',
    DeleteNonFixedAssignedTo = '[AssignedToFiltersTasks] Delete non fixed assigned to'
}

export class AddNewAssignedToFilter implements Action {
    readonly type = AssignedToFiltersTasksActionTypes.AddNewAssignedToFilter;

    constructor(public payload: {filters: Filter[]}) {}
}

export class SetCurrentAssignedToFilter implements Action {
    readonly type = AssignedToFiltersTasksActionTypes.SetCurrentAssingedToFilter;
    constructor(public payload: {currentFilter: Filter}) {}

}

export class DeleteNonFixedAssignedTo implements Action {
    readonly type = AssignedToFiltersTasksActionTypes.DeleteNonFixedAssignedTo;
}

export type AssignedToFiltersTasksActions = AddNewAssignedToFilter | SetCurrentAssignedToFilter | DeleteNonFixedAssignedTo;
