import * as functions from 'firebase-functions';


// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
export {onCreateUser} from './app/users/on-create-user';
export {onUpdateUser} from './app/users/on-update-user';
export {onUpdateProject} from './app/projects/on-update-project';
export {onUpdateTag} from './app/tags/on-update-tag';
export {onDeleteTag} from './app/tags/on-delete-tag';
export {createTaskNotification} from './app/tasks/on-create-task';
export {onUpdateTask, createUpdateNotification} from './app/tasks/on-update-task';
export {onCreateNotification} from './app/notifications/on-create-notification';

