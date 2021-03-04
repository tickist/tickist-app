import {Component, Inject, OnInit} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import { Task } from '@data/tasks/models/tasks';


@Component({
    selector: 'tickist-change-finish-date-dialog',
    templateUrl: './change-finish-date-dialog.component.html',
    styleUrls: ['./change-finish-date-dialog.component.scss']
})
export class ChangeFinishDateDialogComponent implements OnInit {
    changeDate: FormGroup;
    task: Task;

    constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<ChangeFinishDateDialogComponent>) {
        this.task = data.task;
    }

    ngOnInit() {
        const finishDate = this.task.finishDate ? this.task.finishDate : '';
        this.changeDate = new FormGroup({
            finishDate: new FormControl(finishDate, Validators.required)
        });

    }

    close(finishDate?) {
        this.dialogRef.close(finishDate);
    }
}
