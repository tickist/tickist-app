import {Tag} from '../../models/tags';
import moment from 'moment';
import { Task } from '../../models/tasks';
import {Step} from '../../models/steps';

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
    const tags = [...task.tags];
    const index: number = tags.indexOf(tag, 0);
    if (index > -1) {
        tags.splice(index, 1);
    }
    return Object.assign({}, task, {tags: tags});
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

export function setAllStepsToDone(taskSteps: Step[]): Step[] {
    return taskSteps.map(step => {
        return {...step, status: 1};
    });
}

export function setAllStepsToUndone(taskSteps: Step[]): Step[] {
    return taskSteps.map(step => {
        return {...step, status: 0};
    });
}

