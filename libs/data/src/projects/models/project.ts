import {IShareWithUser, ShareWithUser} from './share-with-user';
import {
    DEFAULT_COLOR_LIST,
    DEFAULT_DIALOG_TIME_WHEN_TASK_FINISHED,
    DEFAULT_FINISH_DATE,
    DEFAULT_PRIORITY,
    DEFAULT_PROJECT_ICON,
    DEFAULT_TASK_VIEW,
    DEFAULT_TYPE_FINISH_DATE
} from '../config-projects';
import {Editor} from '@data';
import {addClickableLinks} from '@tickist/utils';
import {ProjectType} from "./projects-type";

interface IProject {
    id: string;
    name: string;
    isActive?: boolean;
    isInbox?: boolean;
    description?: string;
    ancestor?: string;
    color?: string;
    inviteUserByEmail?: string;
    lastEditor: Editor;
}

export enum InviteUserStatus {
    Processing,
    Error
}

export interface InviteUser {
    email: string;
    status: InviteUserStatus;
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
    shareWith: ShareWithUser[] = [];
    owner: number | string;
    defaultFinishDate = DEFAULT_FINISH_DATE;
    defaultPriority = DEFAULT_PRIORITY;
    defaultTypeFinishDate = DEFAULT_TYPE_FINISH_DATE;
    dialogTimeWhenTaskFinished = DEFAULT_DIALOG_TIME_WHEN_TASK_FINISHED;
    taskView = DEFAULT_TASK_VIEW.value;
    matOptionClass: string;
    shareWithIds: Array<string> = [];
    inviteUserByEmail: InviteUser[] = [];
    lastEditor: Editor;
    projectType: ProjectType = ProjectType.ALIVE;
    icon = DEFAULT_PROJECT_ICON;

    constructor(project: any) {
        Object.assign(this, project);
        this.id = project.id || null;
        this.ancestor = project.ancestor || undefined;
        this.richDescription = addClickableLinks(project.description);
        if (project.isInbox) this.projectType = ProjectType.INBOX;
        if (project.taskView) this.taskView = project.taskView;
        if (project.defaultTypeFinishDate === null) this.defaultTypeFinishDate = DEFAULT_TYPE_FINISH_DATE;
        this.shareWith = this.shareWith.map((user) => new ShareWithUser(<IShareWithUser> user));
    }
}


