import {Tag} from '@data/tags/models/tags';
import {Task} from '@data/tasks/models/tasks';
import {Step} from '@data/tasks/models/steps';
import {addDays, getDaysInMonth, isDate, isPast, isToday} from 'date-fns';

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


export function removeTag(task: Task, deletedTag: Tag): Task {
    const tags = [...task.tags];
    const index: number = tags.indexOf(deletedTag, 0);
    if (index > -1) {
        tags.splice(index, 1);
    }
    return Object.assign({}, task, {tags: tags, tagsIds: tags.map(tag=>tag.id)});
}

export function moveFinishDateFromPreviousFinishDate(task, delta: string | number): Task {
    const newTask = Object.assign({}, task);
    if (!isDate(task.finishDate)) newTask.finishDate = new Date();

    if (delta === 'today' || !task.finishDate) {
        newTask.finishDate = new Date();
    } else if (delta === 'lastDayOfMonth') {
        newTask.finishDate = getDaysInMonth(new Date());
    } else {
        newTask.finishDate = addDays(task.finishDate, <number> delta);
    }
    return newTask;
}


export function isRepeated(task: Task): boolean {
    return task.repeat > 0;
}

export function isOverdue(task: Task): boolean {
    return !isToday(task.finishDate) && isPast(task.finishDate)
}

export function setAllStepsToDone(taskSteps: Step[]): Step[] {
    return taskSteps.map(step => ({...step, status: 1}));
}

export function setAllStepsToUndone(taskSteps: Step[]): Step[] {
    return taskSteps.map(step => ({...step, status: 0}));
}

