import {Tag} from '../../models/tags';
import * as moment from 'moment';
import { Task } from '../../models/tasks';

export function hideAllMenuElements(task: Task): Task {
    return Object.assign({}, task, {
        menuShowing: {
            isFinishDate: false,
            isTaskProject: false,
            isAssignedTo: false,
            isRepeat: false,
            isTags: false,
            isSteps: false,
            isDescription: false
        }
    });
}


export function removeTag(task: Task, tag: Tag): Task {
    const newTask = Object.assign({}, task);
    const index: number = newTask.tags.indexOf(tag, 0);
    if (index > -1) {
        newTask.tags.splice(index, 1);
    }
    return newTask;
}

export function moveFinishDateFromPreviousFinishDate(task, delta: string | number): Task {
    const newTask = Object.assign({}, task);
    if (!moment.isMoment(task.finishDate)) newTask.finishDate = moment();

    if (delta === 'today' || !task.finishDate) {
        newTask.finishDate = moment();
    } else if (delta === 'lastDayOfMonth') {
        newTask.finishDate = moment().date(moment().daysInMonth());
    } else {
        newTask.finishDate = (moment(task.finishDate)).add(delta, 'day');
    }
    return newTask;
}


export function isRepeated(task: Task): boolean {
    return task.repeat > 0;
}

export function isOverdue(task: Task): boolean {
    return task.finishDate < moment().hours(0).minutes(0).seconds(0);
}

