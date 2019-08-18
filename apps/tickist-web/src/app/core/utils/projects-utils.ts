import {Project, ShareWithUser, SimpleProject} from '../../../../../../libs/data/src/lib/projects/models';
import {ISimpleProjectApi} from '../../../../../../libs/data/src/lib/simple-project-api.inferface';
import {ISimpleUserApi} from '../../../../../../libs/data/src/lib/simple-user-api.interface';
import {IPendingUser} from '../../../../../../libs/data/src/lib/pending-user-api.interface';
import {toSnakeCase} from './toSnakeCase';
import {ShareWithPendingUser} from '../../../../../../libs/data/src/lib/projects/models/share-with-pending-user';
import {ProjectLeftPanel} from '../../modules/left-panel/modules/projects-list/models/project-list';
import * as _ from 'lodash';
import {ProjectWithLevel} from '../../../../../../libs/data/src/lib/projects/models/project-with-level';

export function addUserToShareList(project: (SimpleProject | Project), user) {
    const shareWith = [...project.shareWith];
    const shareWithOnlyIds = shareWith.map(simpleUser => (<ShareWithUser> simpleUser).id);
    if (user.hasOwnProperty('id') && !shareWithOnlyIds.includes(user.id)) {
        shareWith.push(new ShareWithUser(user));
    } else if (!user.hasOwnProperty('id')) {
        shareWith.push(new ShareWithPendingUser(user));
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


export function calculateProjectDescendants(activeProject, projects) {
    const projectDescendants = [activeProject.id];
    const children = projects.filter(project => activeProject.id === project.ancestor);
    const childrenIds = children.map(project => project.id);
    const grandChildren = projects.filter(project => childrenIds.includes(project.ancestor));
    return projectDescendants.concat(childrenIds, grandChildren.map(project => project.id));
}


export function calculateTasksCounter(projects, tasks) {

    return projects.map(project => {
        const tasksCounter = tasks.filter(task => task.taskProject.id === project.id).length;
        return new ProjectLeftPanel({
            name: project.name,
            id: project.id,
            color: project.color,
            ancestor: project.ancestor,
            shareWith: project.shareWith,
            shareWithIds: project.shareWithIds,
            tasksCounter: tasksCounter,
            level: project.level
        });
    });
}

export function calculateProjectsLevel(projects) {
    const firstLevel = projects
        .filter(project => !project.ancestor)
        .map(project => new ProjectWithLevel({...project, level: 0}));
    const firstLevelIds = firstLevel.map(project => project.id);
    const secondLevel = projects
        .filter(project => firstLevelIds.includes(project.ancestor))
        .map(project => new ProjectWithLevel({...project, level: 1}));
    const secondLevelIds = secondLevel.map(project => project.id);
    const thirdLevel = projects
        .filter(project => secondLevelIds.includes(project.ancestor))
        .map(project => new ProjectWithLevel({...project, level: 2}));
    return [firstLevel, secondLevel, thirdLevel];
}


export function generateDifferentLevelsOfProjects(projects: Project[]): ProjectWithLevel[] {
    // @TODO change list_of_list => ProjectsTreeview
    projects = _.orderBy(projects,
        ['isInbox', 'name'],
        ['desc', 'asc']
    );

    const list_of_list = [];
    const [firstLevel, secondLevel, thirdLevel] = calculateProjectsLevel(projects);

    firstLevel.forEach((item_0) => {
        list_of_list.push(item_0);
        secondLevel.forEach((item_1) => {
            if (item_1.ancestor === item_0.id) {
                list_of_list.push(item_1);
                thirdLevel.forEach((item_2) => {
                    if (item_2.ancestor === item_1.id) {
                        list_of_list.push(item_2);
                    }
                });
            }
        });

    });
    // if we have a shared list on the second level
    secondLevel.forEach((item_1) => {
        if (list_of_list.indexOf(item_1) === -1) {
           // item_1.level = 0;
            list_of_list.push(item_1);
            thirdLevel.forEach((item_2) => {
                if (item_2.ancestor === item_1.id) {
                    list_of_list.push(item_2);
                }
            });
        }
    });
    // if we have the shared lists on the third level
    thirdLevel.forEach((item_2) => {
        if (list_of_list.indexOf(item_2) === -1) {
           // item_2.level = 0;
            list_of_list.push(item_2);
        }
    });

    return list_of_list;
}
