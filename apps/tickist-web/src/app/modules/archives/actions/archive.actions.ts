import { Task } from '@data';
import {createAction, props} from "@ngrx/store";

export const getArchivedTasks = createAction('[Archive] Get Archived Tasks', props<{projectId: string, userId: string}>())
export const saveToStore = createAction('[Archive] Save to store', props<{archivedTasks: Task[]}>())
export const startFetching = createAction('[Archive] Start fetching archive')
export const stopFetching = createAction('[Archive] Stop fetching archive')
export const clearArchive = createAction('[Archive] Clear archive')
