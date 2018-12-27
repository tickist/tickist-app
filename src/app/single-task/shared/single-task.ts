import {Task} from '../../models/tasks';
import {TaskService} from '../../services/task.service';
import {MatDialog} from '@angular/material';
import {Step} from '../../models/steps';
import {TimeDialogComponent} from '../time-dialog/time-dialog.component';
import {ChangeFinishDateDialogComponent} from '../change-finish-date-dialog/change-finish-date-dialog.component';
import * as moment from 'moment';
import {DeleteTaskDialogComponent} from '../delete-task-dialog/delete-task.dialog.component';

export class SingleTask {
    task: Task;
    isRightMenuVisible = false;
    isFastMenuVisible = false;
    isMouseOver = false;

    constructor(public taskService: TaskService, public dialog: MatDialog) {

    }

    changeShowing(show) {
        const oldValue = this.task.menuShowing[show];
        this.task.menuShowing.hideAllMenuElements();
        if (show !== undefined) {
            this.task.menuShowing[show] = !oldValue;
        }
    }

    isSharedList(): boolean {
        return this.task.taskProject.shareWith.length > 0;
    }

    hideAllMenuElements(): void {
        this.task.menuShowing.hideAllMenuElements();
    }

    toggleDoneStep(step) {
        this.task.steps.forEach((s: Step) => {
            if (s.id === step.id) {
                if (s.status === 1) {
                    s.status = 0;
                } else {
                    s.status = 1;
                }
            }
        });
        this.taskService.updateTask(this.task);
    }

    toggleDone() {
        if (this.task.status === 0) {
            this.task.status = 1;
            if (this.task.taskProject.dialogTimeWhenTaskFinished) {
                const dialogRef = this.dialog.open(TimeDialogComponent, {
                    data: {'task': this.task}
                });
                dialogRef.afterClosed().subscribe(result => {
                    if (result) {
                        this.task.estimateTime = result['estimateTime'];
                        this.task.time = result['realTime'];
                    }
                    this.taskService.updateTask(this.task);
                });
            } else if (this.task.isRepeated() && this.task.isOverdue() && this.task.fromRepeating === 1) {
                const dialogRef = this.dialog.open(ChangeFinishDateDialogComponent, {
                    data: {'task': this.task}
                });
                dialogRef.afterClosed().subscribe(result => {
                    if (result && result.hasOwnProperty('finishDate')) {
                        this.task.finishDate = moment(result['finishDate'], 'DD-MM-YYYY');
                    }
                    this.taskService.updateTask(this.task);
                });
            } else {
                this.taskService.updateTask(this.task);
            }
        } else if (this.task.status === 1) {
            this.task.status = 0;
            this.taskService.updateTask(this.task);
        } else if (this.task.status === 2) {
            this.task.status = 0;
            this.taskService.updateTask(this.task);
        }

    }

    togglePin(): void {
        this.task.pinned = !this.task.pinned;
        this.taskService.updateTask(this.task);
    }

    changePriority(priority: string) {
        if (this.task.priority !== priority) {
            this.task.priority = priority;
            this.taskService.updateTask(this.task);
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
        this.task.moveFinishDateFromPreviousFinishDate(delta);
        this.taskService.updateTask(this.task);
    }


    deleteTask() {
        const dialogRef = this.dialog.open(DeleteTaskDialogComponent);
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.taskService.deleteTask(this.task);
            }
        });
    }

    saveTimeValues(time) {
        this.task.time = time.time;
        this.task.estimateTime = time.estimateTime;
    }
}
