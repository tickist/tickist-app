import {isRepeated, setAllStepsToDone, setAllStepsToUndone} from './task-utils';
import {Task} from '@data/tasks/models/tasks';
import {debug} from 'util';
import {addBusinessDays, addDays, addMonths, addWeeks, addYears} from 'date-fns';

export function setStatusDoneLogic(task): Task {
    if (isRepeated(task)) {
        return repeatTaskLogic(task);
    } else {
        return Object.assign({}, task, {isDone: true, steps: setAllStepsToDone(task.steps)});
    }
}


export function repeatTaskLogic(task: Task): Task {
    let finishDate = task.finishDate || new Date();

    if (task.fromRepeating === 0) {
        finishDate = new Date();
    }

    switch (task.repeat) {
        case 1:
            addDays(finishDate, task.repeatDelta);
            break;
        case 2:
            finishDate = addBusinessDays(finishDate, task.repeatDelta);
            break;
        case 3:
            addWeeks(finishDate, task.repeatDelta);
            break;
        case 4:
            addMonths(finishDate, task.repeatDelta);
            break;
        case 5:
            addYears(finishDate, task.repeatDelta);
            break;
    }

    return Object.assign({}, task, {
        isDone: false,
        time: 0,
        steps: setAllStepsToUndone(task.steps),
        finishDate: finishDate
    });
}


// function calculateFinishDateWorkWeek(finishDate, delta) {
//     const newFinishDate = finishDate ? finishDate) : moment(new Date());
//     for (let i = 0; i < delta; i++) {
//         newFinishDate.add(1, 'days');
//         if (newFinishDate.day() === 6) {
//             // set to monday from Saturday
//             newFinishDate.add(2, 'days');
//         } else if (newFinishDate.day() === 0) {
//             // set to monday from Sunday
//             newFinishDate.add(1, 'days');
//         }
//     }
//     return newFinishDate;
// }


