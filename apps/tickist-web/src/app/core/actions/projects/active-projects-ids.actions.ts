import {createAction, props} from '@ngrx/store';

export const newActiveProjectsIds = createAction(
    '[ActiveProjectsIds] Add completely new ids',
    props<{projectsIds: Array<string>}>()
)

export const addNewActiveProjectId= createAction(
    '[ActiveProjectsIds] Add new id',
    props<{projectId: string}>()
)

export const deleteActiveProjectId= createAction(
    '[ActiveProjectsId] Delete id',
    props<{projectId: string}>()
)
