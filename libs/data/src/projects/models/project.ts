import {convert} from '../../../../../apps/tickist-web/src/app/core/utils/addClickableLinksToString';
import {IShareWithUser, ShareWithUser} from './share-with-user';
import {IPendingUser, ShareWithPendingUser} from './share-with-pending-user';
import {
    DEFAULT_COLOR_LIST,
    DEFAULT_DIALOG_TIME_WHEN_TASK_FINISHED, DEFAULT_FINISH_DATE,
    DEFAULT_PRIORITY,
    DEFAULT_TASK_VIEW,
    DEFAULT_TYPE_FINISH_DATE
} from '../config-projects';
import construct = Reflect.construct;

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
    shareWith: (ShareWithUser | ShareWithPendingUser)[] = [];
    owner: number | string;
    defaultFinishDate = DEFAULT_FINISH_DATE;
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
        this.richDescription = convert(project.description);
        if (project.taskView) this.taskView = project.taskView;
        this.shareWith.map((user) => {
            if (user.hasOwnProperty('id')) {
                return new ShareWithUser(<IShareWithUser> user);
            }
            return new ShareWithPendingUser(<IPendingUser> user);
        });
    }
}


