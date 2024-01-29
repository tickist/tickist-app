import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from "@angular/material/dialog";
import { UntypedFormControl, UntypedFormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Task } from "@data/tasks/models/tasks";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FlexModule } from "@ngbracket/ngx-layout/flex";

@Component({
    selector: "tickist-time-dialog",
    templateUrl: "./time-dialog.component.html",
    standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        MatDialogTitle,
        MatDialogContent,
        FlexModule,
        MatFormFieldModule,
        MatInputModule,
        FaIconComponent,
        MatTooltipModule,
        MatDialogActions,
        MatButtonModule,
        MatDialogClose,
    ],
})
export class TimeDialogComponent {
    timeForm: UntypedFormGroup;
    task: Task;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<TimeDialogComponent>,
    ) {
        this.task = data.task;
        this.timeForm = this.createForm();
    }

    saveTime(values: any) {
        this.dialogRef.close(values);
    }

    createForm() {
        if (this.task) {
            return new UntypedFormGroup({
                estimateTime: new UntypedFormControl(this.task.estimateTime),
                realTime: new UntypedFormControl(this.task.time),
            });
        } else {
            return new UntypedFormGroup({
                estimateTime: new UntypedFormControl(),
                realTime: new UntypedFormControl(),
            });
        }
    }
}
