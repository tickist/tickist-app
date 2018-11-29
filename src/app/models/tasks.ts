import {SimplyUser} from './user';
import {Tag} from './tags';
import {Api} from './commons';
import * as moment from 'moment';
import {SimpleProject} from './projects';
import {Step} from './steps';
import {Menu} from './menu';


export class Task extends Api {
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
        this.finishTime = task.finish_time ? task.finish_time : '';
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

    moveFinishDateFromPreviousFinishDate(delta: string | number): void {
        if (!moment.isMoment(this.finishDate)) this.finishDate = moment();

        if (delta === 'today' || !this.finishDate) {
            this.finishDate = moment();
        } else if (delta === 'lastDayOfMonth') {
            this.finishDate = moment().date(moment().daysInMonth());
        } else {
            this.finishDate = (<moment.Moment> this.finishDate).add(delta, 'day');
        }

    }

    isRepeated(): boolean {
        return this.repeat > 0;
    }

    isOverdue(): boolean {
        return this.finishDate < moment().hours(0).minutes(0).seconds(0);
    }
    
    private convert(text: string): string {
        const exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
        const exp2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
        let richText;
        if (text) {
            richText = text.replace(exp, '<a target="_blank" href=\'$1\'>$1</a>')
                .replace(exp2, '$1<a target="_blank" href="http://$2">$2</a>');
        } else {
            richText = text;
        }
        return richText;
    }
}

