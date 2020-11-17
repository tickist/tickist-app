import {createAction, props} from '@ngrx/store';
import {Project} from '@data/projects';


export const setActiveProject = createAction(
    '[ActiveProject] Set Active project',
    props<{project: Project}>()
)

export const clearActiveProject = createAction(
    '[ActiveProject] Clear Active project'
)
