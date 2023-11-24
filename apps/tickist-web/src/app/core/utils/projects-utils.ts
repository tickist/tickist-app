import { InviteUserStatus, Project, ProjectType, ProjectWithLevel } from "@data/projects";
import { ProjectLeftPanel } from "../../modules/projects-list/models/project-list";
// eslint-disable-next-line @typescript-eslint/naming-convention
import _ from "lodash";

export function addUserToShareList(project: Project, email) {
    // const shareWith = [...project.shareWith];
    // const shareWithOnlyIds = shareWith.map(simpleUser => (<ShareWithUser>simpleUser).id);
    // if (user.hasOwnProperty('id') && !shareWithOnlyIds.includes(user.id)) {
    //     shareWith.push(new ShareWithUser(user));
    // }
    //
    const entry = { email: email, status: InviteUserStatus.processing };
    return Object.assign({}, project, {
        inviteUserByEmail: [...project.inviteUserByEmail, entry],
    });
}

export function calculateProjectDescendants(activeProject, projects) {
    const projectDescendants = [activeProject.id];
    const children = projects.filter((project) => activeProject.id === project.ancestor);
    const childrenIds = children.map((project) => project.id);
    const grandChildren = projects.filter((project) => childrenIds.includes(project.ancestor));
    return projectDescendants.concat(
        childrenIds,
        grandChildren.map((project) => project.id),
    );
}

export function calculateTasksCounter(projects, tasks) {
    return projects.map((project) => {
        const tasksCounter = tasks.filter((task) => task.taskProject.id === project.id).length;
        return new ProjectLeftPanel({
            name: project.name,
            id: project.id,
            color: project.color,
            ancestor: project.ancestor,
            shareWith: project.shareWith,
            shareWithIds: project.shareWithIds,
            tasksCounter: tasksCounter,
            level: project.level,
            icon: project.icon,
            owner: project.owner,
            projectType: project.projectType,
        });
    });
}

export function calculateProjectsLevel(projects) {
    const firstLevel = projects.filter((project) => !project.ancestor).map((project) => new ProjectWithLevel({ ...project, level: 0 }));
    const firstLevelIds = firstLevel.map((project) => project.id);
    const secondLevel = projects
        .filter((project) => firstLevelIds.includes(project.ancestor))
        .map((project) => new ProjectWithLevel({ ...project, level: 1 }));
    const secondLevelIds = secondLevel.map((project) => project.id);
    const thirdLevel = projects
        .filter((project) => secondLevelIds.includes(project.ancestor))
        .map((project) => new ProjectWithLevel({ ...project, level: 2 }));
    const thirdLevelIds = thirdLevel.map((project) => project.id);
    const usedProjectsIds = [...firstLevelIds, ...secondLevelIds, ...thirdLevelIds];
    const projectsFromSharedLists = projects
        .filter((project) => !usedProjectsIds.includes(project.id))
        .map((project) => new ProjectWithLevel({ ...project, level: 0 }));
    return [[...firstLevel, ...projectsFromSharedLists], secondLevel, thirdLevel];
}

export function generateDifferentLevelsOfProjects(projects: Project[]): ProjectWithLevel[] {
    // @TODO change listOfList => ProjectsTreeview
    projects = _.orderBy(projects, [(project) => _.deburr(project.name.toLowerCase())], ["asc"]);

    const listOfList = [];
    const [firstLevel, secondLevel, thirdLevel] = calculateProjectsLevel(projects);

    firstLevel.forEach((item0) => {
        listOfList.push(item0);
        secondLevel.forEach((item1) => {
            if (item1.ancestor === item0.id) {
                listOfList.push(item1);
                thirdLevel.forEach((item2) => {
                    if (item2.ancestor === item1.id) {
                        listOfList.push(item2);
                    }
                });
            }
        });
    });
    // if we have a shared list on the second level
    secondLevel.forEach((item1) => {
        if (listOfList.indexOf(item1) === -1) {
            // item1.level = 0;
            listOfList.push(item1);
            thirdLevel.forEach((item2) => {
                if (item2.ancestor === item1.id) {
                    listOfList.push(item2);
                }
            });
        }
    });
    // if we have the shared lists on the third level
    thirdLevel.forEach((item2) => {
        if (listOfList.indexOf(item2) === -1) {
            // item2.level = 0;
            listOfList.push(item2);
        }
    });

    return listOfList;
}

export function hasProjectDescription(project) {
    return project.description && project.description.length > 0;
}

export function isProjectType(arg): boolean {
    return Object.values(ProjectType).includes(arg);
}
