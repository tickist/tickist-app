import {SimpleUser} from '../../core/models';
import {Tag} from '../tags';
import moment from 'moment';
import {SimpleProject} from '../projects';
import {Step} from './steps';
import {Menu} from '../menu';
import {convert} from '../../core/utils/addClickableLinksToString';
import {ISimpleProjectApi} from '../simple-project-api.inferface';
import {ISimpleUserApi} from '../simple-user-api.interface';
import {TaskUser} from './task-user';

export interface ITaskApi {
    name: string;
    id?: string;
    finishDate: string;
    finishTime: string;
    suspendDate: string;
    pinned: boolean;
    status: number;
    typeFinishDate: number;
    taskProject: TaskProject;
    owner: TaskUser;
    ownerPk: number;
    author: TaskUser;
    percent: number;
    priority: string;
    repeat: number | string;
    fromRepeating: number;
    repeatDelta: number;
    description: string;
    estimateTime: number;
    time: number;
    isActive: boolean;
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
    description: string;
    richName: string;
    richDescription: string;
    finishDate: any;
    finishTime: string;
    suspendDate: any;
    pinned: boolean;
    isActive: boolean;
    status: number;
    typeFinishDate: number;
    taskProject: TaskProject;
    owner: TaskUser;
    steps: Step[] = [];
    priority: string;
    percent: number;
    repeat: number;
    repeatDelta: number;
    author: TaskUser;
    fromRepeating: number;
    tags: Tag[] = [];
    time: number;
    estimateTime: number;
    menuShowing: Menu;


    constructor(task: ITaskApi) {
        this.name = task.name;
        this.richName = convert(task.name);
        this.id = task.id || null;
        this.finishDate = task.finishDate ? moment(task.finishDate, 'DD-MM-YYYY') : '';
        this.finishTime = task.finishTime ? task.finishTime : '';
        this.suspendDate = task.suspendDate ? moment(task.suspendDate, 'DD-MM-YYYY') : '';
        this.pinned = task.pinned;
        this.status = task.status;
        this.typeFinishDate = task.typeFinishDate;
        this.taskProject = new SimpleProject(task.taskProject);
        this.owner = new SimpleUser(task.owner);
        this.author = new SimpleUser(task.author);
        this.percent = task.percent;
        this.priority = task.priority;
        this.repeat = parseInt((<string> task.repeat), 10);
        this.fromRepeating = task.fromRepeating;
        this.repeatDelta = task.repeatDelta;
        this.description = task.description;
        this.richDescription = convert(task.description);
        this.estimateTime = task.estimateTime ? task.estimateTime : null;
        this.time = task.time;
        this.isActive = task.isActive;
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


