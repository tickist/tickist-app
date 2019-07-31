import {SimpleUser} from '../core/models';
import {Tag} from './tags';
import moment from 'moment';
import {SimpleProject} from './projects';
import {Step} from './steps';
import {Menu} from './menu';
import {ITaskApi} from './task-api.interface';
import {convert} from '../core/utils/addClickableLinksToString';


export class Task {
    id: number;
    name: string;
    description: string;
    richName: string;
    richDescription: string;
    finishDate: any;
    finishTime: string;
    when_complete: any;
    suspendDate: any;
    pinned: boolean;
    isActive: boolean;
    status: number;
    typeFinishDate: number;
    taskProject: SimpleProject;
    owner: SimpleUser;
    steps: Step[] = [];
    priority: string;
    percent: number;
    repeat: number;
    repeatDelta: number;
    author: SimpleUser;
    fromRepeating: number;
    tags: Tag[] = [];
    time: number;
    estimateTime: number;
    menuShowing: Menu;


    constructor(task: ITaskApi) {
        this.name = task.name;
        this.richName = convert(task.name);
        this.id = task.id || undefined;
        this.finishDate = task.finish_date ? moment(task.finish_date, 'DD-MM-YYYY') : '';
        this.finishTime = task.finish_time ? task.finish_time : '';
        this.suspendDate = task.suspend_date ? moment(task.suspend_date, 'DD-MM-YYYY') : '';
        this.pinned = task.pinned;
        this.status = task.status;
        this.typeFinishDate = task.type_finish_date;
        this.taskProject = new SimpleProject(task.task_project);
        this.owner = new SimpleUser(task.owner);
        this.author = new SimpleUser(task.author);
        this.percent = task.percent;
        this.priority = task.priority;
        this.repeat = parseInt((<string> task.repeat), 10);
        this.fromRepeating = task.from_repeating;
        this.repeatDelta = task.repeat_delta;
        this.description = task.description;
        this.richDescription = convert(task.description);
        this.estimateTime = task.estimate_time ? task.estimate_time : null;
        this.time = task.time;
        this.isActive = task.is_active;
        if (Array.isArray(task.steps)) {
            task.steps.forEach((step) => {
                this.steps.push(new Step(step));
            });
        }
        task.tags.forEach((tag) => {
            this.tags.push(new Tag(tag));
        });
        this.menuShowing = new Menu(task.menu_showing);
    }

}


