import {Task} from '../../models/tasks';
import {TaskService} from '../../core/services/task.service';
import {MatDialog} from '@angular/material';
import {Step} from '../../models/steps';
import {TimeDialogComponent} from '../time-dialog/time-dialog.component';
import {ChangeFinishDateDialogComponent} from '../change-finish-date-dialog/change-finish-date-dialog.component';
import * as moment from 'moment';
import {DeleteTaskDialogComponent} from '../delete-task-dialog/delete-task.dialog.component';
import {DeleteTask, UpdateTask} from '../../core/actions/tasks/task.actions';
import {AppStore} from '../../store';
import {Store} from '@ngrx/store';
import {hideAllMenuElements, isOverdue, isRepeated, moveFinishDateFromPreviousFinishDate} from '../utils/task-utils';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';

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
        return this.task.taskProject.shareWith.length > 0;
    }

    hideAllMenuElements(): void {
        this.task = hideAllMenuElements(this.task);
    }

    toggleDoneStep(toggledStep) {
        this.task.steps.forEach((step: Step) => {
            if (step.id === toggledStep.id) {
                if (step.status === 1) {
                    step.status = 0;
                } else {
                    step.status = 1;
                }
            }
        });
        this.amountOfStepsDoneInPercent = this.task.steps.filter(step => step.status === 1).length * 100 / this.task.steps.length;
        this.store.dispatch(new UpdateTask({task: {id: this.task.id, changes: this.task}}));
        // this.taskService.updateTask(this.task);
    }

    toggleDone() {
       let task;
        if (this.task.status === 0) {
            task = Object.assign({}, this.task, {status: 1});
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
                        this.store.dispatch(new UpdateTask({task: {id: task.id, changes: task}}));
                    });
            } else if (isRepeated(this.task) && isOverdue(this.task) && this.task.fromRepeating === 1) {
                task = Object.assign({}, this.task);
                const dialogRef = this.dialog.open(ChangeFinishDateDialogComponent, {
                    data: {'task': task}
                });
                dialogRef.afterClosed()
                    .pipe(takeUntil(this.ngUnsubscribe))
                    .subscribe(result => {
                        if (result && result.hasOwnProperty('finishDate')) {
                            task.finishDate = moment(result['finishDate'], 'DD-MM-YYYY');
                        }
                        this.store.dispatch(new UpdateTask({task: {id: task.id, changes: task}}));
                    });
            } else {
                this.store.dispatch(new UpdateTask({task: {id: task.id, changes: task}}));
            }
        } else if (this.task.status === 1) {
            task = Object.assign({}, this.task, {status: 0});
            this.store.dispatch(new UpdateTask({task: {id: task.id, changes: task}}));
        } else if (this.task.status === 2) {
            task = Object.assign({}, this.task, {status: 0});
            this.store.dispatch(new UpdateTask({task: {id: task.id, changes: task}}));
        }

    }

    togglePin(): void {
        const task = Object.assign({}, this.task, {pinned: !this.task.pinned});
        this.store.dispatch(new UpdateTask({task: {id: task.id, changes: task}}));
    }

    changePriority(priority: string) {
        if (this.task.priority !== priority) {
            const task = Object.assign({}, this.task, {priority: priority});
            this.store.dispatch(new UpdateTask({task: {id: task.id, changes: task}}));
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
        this.store.dispatch(new UpdateTask({task: {id: this.task.id, changes: this.task}}));
        // this.taskService.updateTask(this.task);
    }


    deleteTask() {
        const dialogRef = this.dialog.open(DeleteTaskDialogComponent);
        dialogRef.afterClosed()
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(result => {
                if (result) {
                    this.store.dispatch(new DeleteTask({taskId: this.task.id}));
                    // this.taskService.deleteTask(this.task);
                }
            });
    }

    saveTimeValues(time) {
        this.task.time = time.time;
        this.task.estimateTime = time.estimateTime;
    }
}
