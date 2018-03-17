import {Component, Inject} from '@angular/core';
import {MatDialogRef} from '@angular/material';
import {FormGroup, FormBuilder} from '@angular/forms';
import {Task} from '../../models/tasks';
import {MAT_DIALOG_DATA} from '@angular/material';

@Component({
    selector: 'tickist-time-dialog',
    templateUrl: './time-dialog.component.html',
})
export class TimeDialogComponent {
    timeForm: FormGroup;
    task: Task;

    constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<TimeDialogComponent>,
                protected fb: FormBuilder) {
        this.task = data.task;
        this.timeForm = this.createForm();
    }

    saveTime(values: any) {
        this.dialogRef.close(values);
    }

    createForm() {
        if (this.task) {
            return this.fb.group({
                'estimateTime': [this.task.estimateTime],
                'realTime': [this.task.time],
            });
        } else {
            return this.fb.group({
                'estimateTime': [],
                'realTime': [],
            });
        }
    }
}
