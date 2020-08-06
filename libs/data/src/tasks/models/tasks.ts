import {Tag} from '../../tags/models/tags';
import {Step} from './steps';
import {Menu} from '../../menu';
import {TaskUser} from './task-user';
import {TaskProject} from './task-project';
import {addClickableLinks} from '@tickist/utils';
import {Editor} from '@data/users';
import {TaskType} from "@data/tasks/models/task-types";

export interface ITask {
    name: string;
    id?: string;
    finishDate?: Date;
    finishTime?: string;
    suspendDate?: string;
    pinned?: boolean;
    isDone?: boolean;
    onHold?: boolean;
    typeFinishDate?: number;
    taskProject: TaskProject;
    owner: TaskUser;
    ownerPk: string;
    author: TaskUser;
    percent?: number;
    priority: string;
    repeat?: number | string;
    fromRepeating?: number | null;
    repeatDelta?: number | null;
    description?: string;
    estimateTime?: number;
    time?: number;
    isActive?: boolean;
    creationDate?: string;
    modificationDate?: string;
    finishDateDateformat?: string;
    steps?: Array<any>;
    tags?: Tag[];
    tagsIds?: string[];
    taskListPk: string;
    whenComplete?: any;
    taskType: TaskType;
    menuShowing?: Menu;
    lastEditor?: Editor;
}


export class Task {
    id: string;
    name: string;
    description = '';
    richName = '';
    richDescription = '';
    finishDate: Date;
    finishTime: string;
    suspendDate: any;
    pinned = false;
    isActive = true;
    isDone = false;
    onHold = false;
    typeFinishDate = 1;
    taskProject: TaskProject;
    owner: TaskUser;
    steps: Step[] = [];
    priority: string;
    repeat = 0;
    repeatDelta = null;
    author: TaskUser;
    fromRepeating = 0;
    tags: Tag[] = [];
    tagsIds: string[] = [];
    time = null;
    estimateTime = null;
    menuShowing: Menu;
    lastEditor: Editor;
    taskType = TaskType.NORMAL;

    constructor(task: ITask) {
        Object.assign(this, task);
        this.richName = addClickableLinks(task.name);
        this.finishDate = task.finishDate ? new Date(task.finishDate) : null;
        this.finishTime = task.finishTime ? task.finishTime : '';
        this.suspendDate = task.suspendDate ? new Date(task.suspendDate) : '';
        this.repeat = task.repeat ? parseInt((<string> task.repeat), 10) : 0;
        this.richDescription = addClickableLinks(task.description);
        if (Array.isArray(task.steps)) {
            this.steps.map((step) => new Step(step));
        }
        this.tags = this.tags.map(tag => new Tag(tag));
        this.tagsIds = this.tags.map(tag => tag.id);
        this.menuShowing = new Menu(task.menuShowing);
        this.taskProject = new TaskProject(task.taskProject);
    }
}


