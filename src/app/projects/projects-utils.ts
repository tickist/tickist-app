import {PendingUser, SimpleUser} from '../user/models';
import {Project, SimpleProject} from '../models/projects';
import {ISimpleProjectApi} from '../models/simple-project-api.inferface';
import {ISimpleUserApi} from '../models/simple-user-api.interface';
import {IPendingUser} from '../models/pending-user-api.interface';
import {toSnakeCase} from '../utils/toSnakeCase';

export function addUserToShareList(project: (SimpleProject | Project), user) {
    if (user.hasOwnProperty('id')) {
        project.shareWith.push(new SimpleUser(user));
    } else {
        project.shareWith.push(new PendingUser(user));
    }
    return project;
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
