import {Task} from 'app/models/tasks';
import {Tag} from '../../models/tags';
import * as moment from 'moment';

export function hideAllMenuElements(task: Task): Task {
    task.menuShowing.isFinishDate = false;
    task.menuShowing.isTaskProject = false;
    task.menuShowing.isAssignedTo = false;
    task.menuShowing.isRepeat = false;
    task.menuShowing.isTags = false;
    task.menuShowing.isSteps = false;
    task.menuShowing.isDescription = false;

    return task;
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
    if (!moment.isMoment(task.finishDate)) task.finishDate = moment();

    if (delta === 'today' || !task.finishDate) {
        task.finishDate = moment();
    } else if (delta === 'lastDayOfMonth') {
        task.finishDate = moment().date(moment().daysInMonth());
    } else {
        task.finishDate = (moment(task.finishDate)).add(delta, 'day');
    }
    return task;
}


export function isRepeated(task: Task): boolean {
    return task.repeat > 0;
}

export function isOverdue(task: Task): boolean {
    return task.finishDate < moment().hours(0).minutes(0).seconds(0);
}

