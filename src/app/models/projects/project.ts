import {convert} from '../../core/utils/addClickableLinksToString';
import {IShareWithUser, ShareWithUser} from './share-with-user';
import {IPendingUser, ShareWithPendingUser} from './share-with-pending-user';
import {
    DEFAULT_COLOR_LIST,
    DEFAULT_DIALOG_TIME_WHEN_TASK_FINISHED,
    DEFAULT_PRIORITY,
    DEFAULT_TASK_VIEW,
    DEFAULT_TYPE_FINISH_DATE
} from '../../core/config/config-projects';

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
    defaultTypeFinishDate = DEFAULT_TYPE_FINISH_DATE;
    dialogTimeWhenTaskFinished = DEFAULT_DIALOG_TIME_WHEN_TASK_FINISHED;
    taskView = DEFAULT_TASK_VIEW.value;
    matOptionClass: string;
    shareWithIds: Array<string> = [];

    constructor(project: any) {
        Object.assign(this, project);
        this.id = project.id || null;
        this.ancestor = project.ancestor || undefined;
        this.allDescendants = project.getAllDescendants ? project.getAllDescendants : [];
        this.richDescription = convert(project.description);
        this.defaultFinishDate = project.defaultFinishDate;
        this.defaultTypeFinishDate = project.defaultTypeFinishDate;
        if (project.taskView) this.taskView = project.taskView;
        this.dialogTimeWhenTaskFinished = project.dialogTimeWhenTaskFinished;
        this.matOptionClass = `level_${this.level}`;
        this.shareWith.map((user) => {
            if (user.hasOwnProperty('id')) {
                return new ShareWithUser(<IShareWithUser> user);
            }
            return new ShareWithPendingUser(<IPendingUser> user);
        });
        this.shareWithIds = project.shareWithIds;
    }
}
