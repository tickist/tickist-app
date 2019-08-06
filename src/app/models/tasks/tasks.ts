import {Tag} from '../tags';
import moment from 'moment';
import {Step} from './steps';
import {Menu} from '../menu';
import {convert} from '../../core/utils/addClickableLinksToString';
import {TaskUser} from './task-user';
import {TaskProject} from './task-project';

export interface ITaskApi {
    name: string;
    id?: string;
    finishDate: string;
    finishTime: string;
    suspendDate: string;
    pinned?: boolean;
    isDone?: boolean;
    onHold?: boolean;
    typeFinishDate: number;
    taskProject: TaskProject;
    owner: TaskUser;
    ownerPk: number;
    author: TaskUser;
    percent?: number;
    priority: string;
    repeat: number | string;
    fromRepeating: number;
    repeatDelta: number;
    description?: string;
    estimateTime: number;
    time: number;
    isActive?: boolean;
    creationDate?: string;
    modificationDate?: string;
    finishDateDateformat?: string;
    steps: Array<any>;
    tags: Tag[];
    taskListPk: string;
    whenComplete?: any;
    menuShowing?: Menu;
}


export class Task {
    id: string;
    name: string;
    description = '';
    richName: string;
    richDescription: string;
    finishDate: any;
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
    percent = 0;
    repeat: number;
    repeatDelta: number;
    author: TaskUser;
    fromRepeating: number;
    tags: Tag[] = [];
    time: number;
    estimateTime: number;
    menuShowing: Menu;


    constructor(task: ITaskApi) {
        Object.assign(this, task);
        this.richName = convert(task.name);
        this.finishDate = task.finishDate ? moment(task.finishDate, 'DD-MM-YYYY') : '';
        this.finishTime = task.finishTime ? task.finishTime : '';
        this.suspendDate = task.suspendDate ? moment(task.suspendDate, 'DD-MM-YYYY') : '';
        this.repeat = parseInt((<string> task.repeat), 10);
        this.richDescription = convert(task.description);
        this.estimateTime = task.estimateTime ? task.estimateTime : null;
        if (Array.isArray(task.steps)) {
            task.steps.forEach((step) => {
                this.steps.push(new Step(step));
            });
        }
        task.tags.forEach((tag) => {
            this.tags.push(new Tag(tag));
        });
        this.menuShowing = new Menu(task.menuShowing);
    }

}


