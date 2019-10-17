import {Task} from '@data/tasks/models/tasks';
import { MatDialog } from '@angular/material/dialog';
import {Step} from '@data/tasks/models/steps';
import {TimeDialogComponent} from '../time-dialog/time-dialog.component';
import {ChangeFinishDateDialogComponent} from '../change-finish-date-dialog/change-finish-date-dialog.component';
import {DeleteTaskDialogComponent} from '../delete-task-dialog/delete-task.dialog.component';
import {RequestDeleteTask, RequestUpdateTask, SetStatusDone} from '../../core/actions/tasks/task.actions';
import {AppStore} from '../../store';
import {Store} from '@ngrx/store';
import {hideAllMenuElements, isOverdue, isRepeated, moveFinishDateFromPreviousFinishDate} from '../utils/task-utils';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {parse} from 'date-fns';

export class SingleTask {
    task: Task;
    isRightMenuVisible = false;
    isFastMenuVisible = false;
    isMouseOver = false;
    ngUnsubscribe: Subject<void> = new Subject<void>();
    amountOfStepsDoneInPercent: number;

    constructor(public store: Store<AppStore>, public dialog: MatDialog) {

    }

    changeShowing(show) {
        const oldValue = this.task.menuShowing[show];
        this.task = hideAllMenuElements(this.task);
        if (show !== undefined) {
            this.task.menuShowing[show] = !oldValue;
        }
    }

    isSharedList(): boolean {
        // @TODO Fix it
        return false; // this.task.taskProject.shareWith.length > 0;
    }

    hideAllMenuElements(): void {
        this.task = hideAllMenuElements(this.task);
    }

    toggleDoneStep(toggledStep) {
        const steps = [];

        this.task.steps.forEach((step: Step) => {
            let newStatus = step.status;
            if (step.id === toggledStep.id) {
                newStatus = Number(!Boolean(step.status));
            }
            steps.push(Object.assign({}, step, {status: newStatus}));
        });
        const task = Object.assign({}, this.task, {steps: steps});
        this.amountOfStepsDoneInPercent = task.steps.filter(step => step.status === 1).length * 100 / task.steps.length;

        // if amount is 100 the status === 1
        this.store.dispatch(new RequestUpdateTask({task: {id: task.id, changes: task}}));
        if (this.amountOfStepsDoneInPercent === 100) this.toggleDone();
    }

    toggleDone() {
        let task;
        if (this.task.isDone === false) {
            task = Object.assign({}, this.task, {isDone: true});
            if (task.taskProject.dialogTimeWhenTaskFinished) {
                const dialogRef = this.dialog.open(TimeDialogComponent, {
                    data: {'task': task}
                });
                dialogRef.afterClosed()
                    .pipe(takeUntil(this.ngUnsubscribe))
                    .subscribe(result => {
                        if (result) {
                            task.estimateTime = result['estimateTime'];
                            task.time = result['realTime'];
                        }
                        this.store.dispatch(new SetStatusDone({task: {id: task.id, changes: task}}));
                    });
            } else if (isRepeated(this.task) && isOverdue(this.task) && this.task.fromRepeating === 1) {
                const dialogRef = this.dialog.open(ChangeFinishDateDialogComponent, {
                    data: {'task': task}
                });
                dialogRef.afterClosed()
                    .pipe(takeUntil(this.ngUnsubscribe))
                    .subscribe(result => {
                        if (result && result.hasOwnProperty('finishDate')) {
                            task.finishDate = parse(result['finishDate'],  'dd-MM-yyyy', new Date());
                        }
                        this.store.dispatch(new SetStatusDone({task: {id: task.id, changes: task}}));
                    });
            } else {
                this.store.dispatch(new SetStatusDone({task: {id: task.id, changes: task}}));
            }
        } else if (this.task.isDone === true) {
            task = Object.assign({}, this.task, {isDone: false});
            this.store.dispatch(new RequestUpdateTask({task: {id: task.id, changes: task}}));
        } else if (this.task.onHold === true) {
            task = Object.assign({}, this.task, {isDone: false});
            this.store.dispatch(new RequestUpdateTask({task: {id: task.id, changes: task}}));
        }

    }

    togglePin(): void {
        const task = Object.assign({}, this.task, {pinned: !this.task.pinned});
        this.store.dispatch(new RequestUpdateTask({task: {id: task.id, changes: task}}));
    }

    changePriority(priority: string) {
        if (this.task.priority !== priority) {
            const task = Object.assign({}, this.task, {priority: priority});
            this.store.dispatch(new RequestUpdateTask({task: {id: task.id, changes: task}}));
        }
    }

    changeDate(date: string) {
        let delta;
        if (date === 'today') {
            delta = 'today';
        } else if (date === 'next_day') {
            delta = 1;
        } else if (date === 'next_week') {
            delta = 7;
        } else if (date === 'lastDayOfMonth') {
            delta = 'lastDayOfMonth';
        } else if (date === 'next_month') {
            delta = 30;
        }
        const task = moveFinishDateFromPreviousFinishDate(this.task, delta);
        this.store.dispatch(new RequestUpdateTask({task: {id: this.task.id, changes: task}}));
    }


    deleteTask() {
        const dialogRef = this.dialog.open(DeleteTaskDialogComponent);
        dialogRef.afterClosed()
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(result => {
                if (result) {
                    this.store.dispatch(new RequestDeleteTask({taskId: this.task.id}));
                }
            });
    }

    saveTimeValues(time) {
        this.task.time = time.time;
        this.task.estimateTime = time.estimateTime;
    }
}