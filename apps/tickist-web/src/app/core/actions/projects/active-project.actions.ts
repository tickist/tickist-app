import { Action } from '@ngrx/store';
import {Project} from '@data/projects';

export enum ActiveProjectActionTypes {
  SetActiveProject = '[ActiveProject] Set Active project'
}

export class SetActiveProject implements Action {
  readonly type = ActiveProjectActionTypes.SetActiveProject;

  constructor(public payload: {project: Project}) {}
}

export type ActiveProjectActions = SetActiveProject;
