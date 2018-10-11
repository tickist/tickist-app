import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {FormControl} from '@angular/forms';
import { Task } from '../../models/tasks';


@Component({
    selector: 'tickst-change-finish-date-dialog',
    templateUrl: './change-finish-date-dialog.component.html',
    styleUrls: ['./change-finish-date-dialog.component.css']
})
export class ChangeFinishDateDialogComponent implements OnInit {
    changeDate: FormControl;
    task: Task;
    
    constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<ChangeFinishDateDialogComponent>) {
        this.task = data.task;
    }

    ngOnInit() {
        this.changeDate =  new FormControl('');
    }

    close(result) {
        this.dialogRef.close(result);
    }
}
