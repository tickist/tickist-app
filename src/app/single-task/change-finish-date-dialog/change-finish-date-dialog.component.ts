import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import { Task } from '../../models/tasks';


@Component({
    selector: 'tickst-change-finish-date-dialog',
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
        this.changeDate = new FormGroup({
            finishDate: new FormControl(this.task.finishDate.toDate(), Validators.required)
        });

    }

    close(result?) {
        this.dialogRef.close(result);
    }
}
