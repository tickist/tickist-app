import {convert} from '../../core/utils/addClickableLinksToString';
import {ShareWithUser} from './share-with-user';
import {ShareWithPendingUser} from './share-with-pending-user';



export class Project {
    id: string;
    name: string;
    isActive: boolean;
    isInbox: boolean;
    description: string;
    richDescription: string;
    ancestor: string;
    color: string;
    tasksCounter = 0;
    allDescendants: Array<number| string>;
    shareWith: (ShareWithUser | ShareWithPendingUser)[] = [];
    level = 0;
    owner: number | string;
    defaultFinishDate: any;
    defaultPriority: any;
    defaultTypeFinishDate: any;
    dialogTimeWhenTaskFinished: boolean;
    taskView: string;
    matOptionClass: string;
    shareWithIds: Array<string> = [];

    constructor(project: any) {
        this.name = project.name;
        this.id = project.id || null;
        this.ancestor = project.ancestor || undefined;
        this.color = project.color || undefined;
        this.tasksCounter = !(isNaN(project.tasksCounter)) ? project.tasksCounter : 0;
        this.allDescendants = project.getAllDescendants ? project.getAllDescendants : [];
        this.description = project.description;
        this.richDescription = convert(project.description);
        this.defaultFinishDate = project.defaultFinishDate;
        this.defaultPriority = project.defaultPriority;
        this.defaultTypeFinishDate = project.defaultTypeFinishDate;
        this.owner = project.owner;
        this.level = project.level ? project.level : 0;
        this.isActive = project.isActive;
        this.taskView = project.taskView;
        this.dialogTimeWhenTaskFinished = project.dialogTimeWhenTaskFinished;
        this.isInbox = project.isInbox;
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
