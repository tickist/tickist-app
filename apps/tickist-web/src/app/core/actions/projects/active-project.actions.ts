import { Action } from '@ngrx/store';
import {Project} from '../../../../../../../libs/data/src/lib/projects/models';

export enum ActiveProjectActionTypes {
  SetActiveProject = '[ActiveProject] Set Active project'
}

export class SetActiveProject implements Action {
  readonly type = ActiveProjectActionTypes.SetActiveProject;

  constructor(public payload: {project: Project}) {}
}

export type ActiveProjectActions = SetActiveProject;
