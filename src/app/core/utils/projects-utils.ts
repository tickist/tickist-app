import {PendingUser, SimpleUser} from '../models';
import {Project, SimpleProject} from '../../models/projects';
import {ISimpleProjectApi} from '../../models/simple-project-api.inferface';
import {ISimpleUserApi} from '../../models/simple-user-api.interface';
import {IPendingUser} from '../../models/pending-user-api.interface';
import {toSnakeCase} from './toSnakeCase';

export function addUserToShareList(project: (SimpleProject | Project), user) {
    const shareWith = [...project.shareWith];
    const shareWithOnlyIds = shareWith.map(simpleUser => (<SimpleUser> simpleUser).id)
    if (user.hasOwnProperty('id') && !shareWithOnlyIds.includes(user.id)) {
        shareWith.push(new SimpleUser(user));
    } else if (!user.hasOwnProperty('id')) {
        shareWith.push(new PendingUser(user));
    }
    return Object.assign({}, project, {shareWith: shareWith});
}

export function convertToSimpleProject(project: Project): SimpleProject {
    const simpleProjectApi: ISimpleProjectApi = {
        id: project.id,
        name: project.name,
        color: project.color,
        dialog_time_when_task_finished: project.dialogTimeWhenTaskFinished,
        share_with: <(ISimpleUserApi | IPendingUser)[]>project.shareWith.map(user => toSnakeCase(user))
    };
    return new SimpleProject(simpleProjectApi);
}
