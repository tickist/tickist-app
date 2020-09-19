import {Action, createAction} from '@ngrx/store';

export enum AddTaskButtonVisibilityActionTypes {
  ShowAddTaskButton = '[AddTaskButtonVisibility] Show add tasks button',
  HideAddTaskButton = '[AddTaskButtonVisibility] Hide add tasks button',


}
export class ShowAddTaskButton implements Action {
    readonly type = AddTaskButtonVisibilityActionTypes.ShowAddTaskButton;
}

export class HideAddTaskButton implements Action {
    readonly type = AddTaskButtonVisibilityActionTypes.HideAddTaskButton;

}

export const showAddTaskButton = createAction(
    '[AddTaskButtonVisibility] Show add tasks button'
)

export const hideAddTaskButton = createAction(
    '[AddTaskButtonVisibility] Hide add tasks button'
)

export type AddTaskButtonVisibilityActions = ShowAddTaskButton | HideAddTaskButton;
