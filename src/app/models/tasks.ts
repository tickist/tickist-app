import {Project} from './projects';
import {SimplyUser} from './user';
import {Tag} from './tags';
import * as _ from 'lodash';
import {Api} from './commons';
import * as moment from 'moment';
import {SimpleProject} from './projects/simply-project';

class Menu {
    isDescription;
    isSteps;
    isTags;
    isRepeat;
    sharedList;
    isAssignedTo;
    isTaskProject;
    isFinishDate;

    constructor(menu: any = {}) {
        this.isDescription = menu.isDescription || false;
        this.isSteps = menu.isSteps || false;
        this.isTags = menu.isTags || false;
        this.isRepeat = menu.isRepeat || false;
        this.sharedList = menu.sharedList || false;
        this.isAssignedTo = menu.isAssignedTo || false;
        this.isTaskProject = menu.isTaskProject || false;
        this.isFinishDate = menu.isFinishDate || false;
    }


}

export class Task extends Api {
    id: number;
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
    taskProject: SimpleProject;
    owner: SimplyUser;
    steps: Step[] = [];
    priority: string;
    percent: number;
    repeat: number;
    repeatDelta: number;
    author: SimplyUser;
    fromRepeating: number;
    tags: Tag[] = [];
    time: number;
    estimateTime: number;
    prefix_formset = 'steps';
    menuShowing: any;


    constructor(task) {
        super();
        this.name = task.name;
        this.richName = this.convert(task.name);
        this.id = task.id || undefined;
        this.finishDate = task.finish_date ? moment(task.finish_date, 'DD-MM-YYYY') : '';
        this.finishTime =  task.finish_time ?  task.finish_time : '';
        this.suspendDate = task.suspend_date ? moment(task.suspend_date, 'DD-MM-YYYY') : '';
        this.pinned = task.pinned;
        this.status = task.status;
        this.typeFinishDate = task.type_finish_date;
        this.taskProject = new SimpleProject(task.task_project);
        this.owner = new SimplyUser(task.owner);
        this.author = new SimplyUser(task.author);
        this.percent = task.percent;
        this.priority = task.priority;
        this.repeat = task.repeat;
        this.fromRepeating = task.from_repeating;
        this.repeatDelta = task.repeat_delta;
        this.description = task.description;
        this.richDescription = this.convert(task.description);
        this.estimateTime = task.estimate_time;
        this.time = task.time;
        this.isActive = task.is_active;
        task.steps.forEach((step) => {
            this.steps.push(new Step(step));
        });
        task.tags.forEach((tag) => {
            this.tags.push(new Tag(tag));
        });
        this.menuShowing = new Menu(task.menu_showing);
    }

    toApi() {
        const result = super.toApi();
        result['steps'] = this.prepareSteps();
        // if (this.finishTime) {
        //   const hour = this.finishTime.getHours();
        //   const minute = this.finishTime.getMinutes();
        //   const second = this.finishTime.getSeconds();
        //   const hourFormatted = hour < 10 ? '0' + hour : hour;
        //   const minuteFormatted = minute < 10 ? '0' + minute : minute;
        //   const secondFormatted = second < 10 ? '0' + second : second;
        //   result['finish_time'] = `${hourFormatted}:${minuteFormatted}:${secondFormatted}`;
        // }
        if (this.finishDate) {
            result['finish_date'] = this.finishDate.format();
        }
        return result;
    }

    prepareSteps() {
        const formset_step = {};
        let index, i = 0,
            initial_forms_count = 0, reverse_index = this.steps.length - 1;
        if (this.steps.length > 0) {
            while (i < this.steps.length) {
                if (this.steps[i].id && !isNaN(this.steps[i].id)) {
                    index = initial_forms_count;
                    formset_step[this.prefix_formset + '-' + index + '-id'] = this.steps[i].id;
                    initial_forms_count += 1;
                } else {
                    index = reverse_index;
                    reverse_index -= 1;
                }

                formset_step[this.prefix_formset + '-' + index + '-name'] = this.steps[i].name;
                formset_step[this.prefix_formset + '-' + index + '-status'] = this.steps[i].status;

                formset_step[this.prefix_formset + '-' + index + '-task'] = this.steps[i].taskId;
                formset_step[this.prefix_formset + '-' + index + '-order'] = i;

                if (this.steps[i].delete) {
                    formset_step[this.prefix_formset + '-' + index + '-DELETE'] = this.steps[i].delete;
                }
                i += 1;
            }
            formset_step[this.prefix_formset + '-TOTAL_FORMS'] = this.steps.length;
            formset_step[this.prefix_formset + '-INITIAL_FORMS'] = initial_forms_count;
            formset_step[this.prefix_formset + '-MAX_NUM_FORMS'] = '';
        }
        return formset_step;
    }
    
    removeTag(tag: Tag) {
        const index: number = this.tags.indexOf(tag, 0);
        if (index > -1) {
            this.tags.splice(index, 1);
        }
    }

    moveFinishDateFromPreviousFinishDate(delta) {
        if (delta === 'today' || !this.finishDate) {
            this.finishDate = moment();
        }
        this.finishDate = this.finishDate.add(delta, 'day');
    }

    private convert(text) {
        const exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
        const exp2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
        let richText;
        if (text) {
            richText = text.replace(exp, '<a target="_blank" href=\'$1\'>$1</a>').replace(exp2, '$1<a target="_blank" href="http://$2">$2</a>');
        } else {
            richText = text;
        }
        return richText;
    }
}


export class Step extends Api {
    id: number;
    name: string;
    status: number;
    order: number;
    delete: boolean;
    taskId: number;


    constructor(step) {
        super();
        this.id = step.id;
        this.name = step.name;
        this.status = step.status;
        this.order = step.order;
        this.delete = step.delete;
        this.taskId = step.task;

    }
}

