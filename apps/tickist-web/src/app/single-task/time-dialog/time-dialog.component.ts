import {Component, Inject} from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import {FormGroup, FormBuilder, FormControl} from '@angular/forms';
import {Task} from '../../../../../../libs/data/src/tasks/models/tasks';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'tickist-time-dialog',
    templateUrl: './time-dialog.component.html',
})
export class TimeDialogComponent {
    timeForm: FormGroup;
    task: Task;

    constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<TimeDialogComponent>) {
        this.task = data.task;
        this.timeForm = this.createForm();
    }

    saveTime(values: any) {
        this.dialogRef.close(values);
    }

    createForm() {
        if (this.task) {
            return  new FormGroup({
                'estimateTime': new FormControl(this.task.estimateTime),
                'realTime': new FormControl(this.task.time),
            });
        } else {
            return new FormGroup({
                'estimateTime': new FormControl(),
                'realTime': new FormControl(),
            });
        }
    }
}
