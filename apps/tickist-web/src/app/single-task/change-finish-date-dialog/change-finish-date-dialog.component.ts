import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from "@angular/forms";
import { Task } from "@data/tasks/models/tasks";
import { MatButtonModule } from "@angular/material/button";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";

@Component({
    selector: "tickist-change-finish-date-dialog",
    templateUrl: "./change-finish-date-dialog.component.html",
    styleUrls: ["./change-finish-date-dialog.component.scss"],
    standalone: true,
    imports: [
        MatDialogTitle,
        MatDialogContent,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatDialogActions,
        MatButtonModule,
    ],
})
export class ChangeFinishDateDialogComponent implements OnInit {
    changeDate: UntypedFormGroup;
    task: Task;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<ChangeFinishDateDialogComponent>,
    ) {
        this.task = data.task;
    }

    ngOnInit() {
        const finishDate = this.task.finishDate ? this.task.finishDate : "";
        this.changeDate = new UntypedFormGroup({
            finishDate: new UntypedFormControl(finishDate, Validators.required),
        });
    }

    close(finishDate?) {
        this.dialogRef.close(finishDate);
    }
}
