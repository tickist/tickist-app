import {Component, Inject} from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import {UntypedFormGroup, FormBuilder, UntypedFormControl} from '@angular/forms';
import {Task} from '@data/tasks/models/tasks';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';

@Component({
    selector: 'tickist-time-dialog',
    templateUrl: './time-dialog.component.html',
})
export class TimeDialogComponent {
    timeForm: UntypedFormGroup;
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
            return  new UntypedFormGroup({
                'estimateTime': new UntypedFormControl(this.task.estimateTime),
                'realTime': new UntypedFormControl(this.task.time),
            });
        } else {
            return new UntypedFormGroup({
                'estimateTime': new UntypedFormControl(),
                'realTime': new UntypedFormControl(),
            });
        }
    }
}
