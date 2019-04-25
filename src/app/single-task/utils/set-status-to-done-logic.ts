import {isRepeated, setAllStepsToDone, setAllStepsToUndone} from './task-utils';
import {Task} from '../../models/tasks';
import * as moment from 'moment';

export function setStatusDoneLogic(task): Task {
    if (isRepeated(task)) {
        return repeatTaskLogic(task);
    } else {
        return Object.assign({}, task, {status: 1, steps: setAllStepsToDone(task.steps)});
    }
}


export function repeatTaskLogic(task: Task): Task {
    let finishDate = task.finishDate || moment(new Date());

    if (task.fromRepeating === 0) {
        finishDate = moment(new Date());
    }

    switch (task.repeat) {
        case 1:
            finishDate.add(task.repeatDelta, 'days');
            break;
        case 2:
            finishDate = calculateFinishDateWorkWeek(finishDate, task.repeatDelta);
            break;
        case 3:
            finishDate.add(task.repeatDelta, 'weeks');
            break;
        case 4:
            finishDate.add(task.repeatDelta, 'months');
            break;
        case 5:
            finishDate.add(task.repeatDelta, 'years');
            break;
    }

    return Object.assign({}, task, {
        status: 0,
        time: 0,
        steps: setAllStepsToUndone(task.steps),
        finishDate: finishDate
    });
}


function calculateFinishDateWorkWeek(finishDate, delta) {
    const newFinishDate = finishDate ? moment(finishDate) : moment(new Date());
    for (let i = 0; i < delta; i++) {
        newFinishDate.add(1, 'days');
        if (newFinishDate.day() === 6) {
            // set to monday from Saturday
            newFinishDate.add(2, 'days');
        } else if (newFinishDate.day() === 0) {
            // set to monday from Sunday
            newFinishDate.add(1, 'days');
        }
    }
    return newFinishDate;
}


