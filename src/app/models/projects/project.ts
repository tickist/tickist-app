import {convert} from '../../core/utils/addClickableLinksToString';
import {ShareWithUser} from './share-with-user';
import {ShareWithPendingUser} from './share-with-pending-user';
import {DEFAULT_COLOR_LIST, DEFAULT_PRIORITY, DEFAULT_TASK_VIEW} from '../../core/config/config-projects';

interface IProject {
    id: string;
    name: string;
    isActive?: boolean;
    isInbox?: boolean;
    description?: string;
    ancestor?: string;
    color?: string;
}



export class Project {
    id: string;
    name: string;
    isActive = true;
    isInbox = false;
    description = '';
    richDescription = '';
    ancestor: string;
    color = DEFAULT_COLOR_LIST;
    tasksCounter = 0;
    allDescendants: Array<number| string>;
    shareWith: (ShareWithUser | ShareWithPendingUser)[] = [];
    level = 0;
    owner: number | string;
    defaultFinishDate: any;
    defaultPriority = DEFAULT_PRIORITY;
    defaultTypeFinishDate: any;
    dialogTimeWhenTaskFinished: boolean;
    taskView = DEFAULT_TASK_VIEW.value;
    matOptionClass: string;
    shareWithIds: Array<string> = [];

    constructor(project: any) {
        Object.assign(this, project);
        this.id = project.id || null;
        this.ancestor = project.ancestor || undefined;
        this.tasksCounter = !(isNaN(project.tasksCounter)) ? project.tasksCounter : 0;
        this.allDescendants = project.getAllDescendants ? project.getAllDescendants : [];
        this.richDescription = convert(project.description);
        this.defaultFinishDate = project.defaultFinishDate;
        this.defaultTypeFinishDate = project.defaultTypeFinishDate;
        if (project.taskView) this.taskView = project.taskView;
        this.dialogTimeWhenTaskFinished = project.dialogTimeWhenTaskFinished;
        this.matOptionClass = `level_${this.level}`;
        project.shareWith.forEach((user) => {
            if (user.hasOwnProperty('id')) {
                this.shareWith.push(new ShareWithUser(user));
            } else {
                this.shareWith.push(new ShareWithPendingUser(user));
            }

        });
        this.shareWithIds = project.shareWithIds;
    }
}
