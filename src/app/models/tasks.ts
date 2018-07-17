import {Project} from './projects';
import {SimplyUser} from './user';
import {Tag} from './tags';
import * as _ from 'lodash';
import {Api} from './commons';
import * as moment from 'moment';
import {SimpleProject} from './projects/simply-project';
import {Step} from './steps';

class Menu {
    private _isDescription;
    private _isSteps;
    private _isTags;
    private _isRepeat;
    private _isAssignedTo;
    private _isTaskProject;
    private _isFinishDate;

    constructor(menu: any = {}) {
        this._isDescription = menu.isDescription || false;
        this._isSteps = menu.isSteps || false;
        this._isTags = menu.isTags || false;
        this._isRepeat = menu.isRepeat || false;
        this._isAssignedTo = menu.isAssignedTo || false;
        this._isTaskProject = menu.isTaskProject || false;
        this._isFinishDate = menu.isFinishDate || false;
    }

    get isDescription() {
        return this._isDescription;
    }

    set isDescription(newValue: boolean) {
        this._isDescription = newValue;
    }

    get isSteps() {
        return this._isSteps;
    }

    set isSteps(newValue: boolean) {
        this._isSteps = newValue;
    }

    get isTags() {
        return this._isTags;
    }

    set isTags(newValue: boolean) {
        this._isTags = newValue;
    }

    get isRepeat() {
        return this._isRepeat;
    }

    set isRepeat(newValue: boolean) {
        this._isRepeat = newValue;
    }

    get isAssignedTo() {
        return this._isAssignedTo;
    }

    set isAssignedTo(newValue: boolean) {
        this._isAssignedTo = newValue;
    }

    get isTaskProject() {
        return this._isTaskProject;
    }

    set isTaskProject(newValue: boolean) {
        this._isTaskProject = newValue;
    }

    get isFinishDate() {
        return this._isFinishDate;
    }

    set isFinishDate(newValue: boolean) {
        this._isFinishDate = newValue;
    }

    isAtLeastOneMenuElementEnabled(): boolean {
        let result = false;
        for (const prop in this) {
            if (this.hasOwnProperty(prop) && this[prop]) {
                result = true;
                break;
            }
        }
        return result;
    }

    hideAllMenuElements(): void {
        this.isFinishDate = false;
        this.isTaskProject = false;
        this.isAssignedTo = false;
        this.isRepeat = false;
        this.isTags = false;
        this.isSteps = false;
        this.isDescription = false;
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
    menuShowing: Menu;


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
        this.estimateTime = task.estimate_time ? task.estimate_time : null;
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

