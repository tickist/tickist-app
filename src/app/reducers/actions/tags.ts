import {Action} from "@ngrx/store";
import {DELETE_TEAM_MEMBER} from "./team";
import {Tag} from "../../models/tags";
export const ADD_TAGS = 'ADD_TAGS';
export const CREATE_TAG = 'CREATE_TAG';
export const UPDATE_TAG = 'UPDATE_TAG';
export const DELETE_TAG = 'DELETE_TAG';


export class AddTags implements Action {
  readonly type = ADD_TAGS;

  constructor(public payload: Tag[]) {
  }
}

export class CreateTag implements Action {
  readonly type = CREATE_TAG;

  constructor(public payload: Tag) {
  }
}

export class UpdateTag implements Action {
  readonly type = UPDATE_TAG;

  constructor(public payload: Tag) {
  }
}

export class DeleteTag implements Action {
  readonly type = DELETE_TAG;

  constructor(public payload: Tag) {
  }
}

export type Actions = AddTags | CreateTag | UpdateTag | DeleteTag;
