import {Component, OnInit} from '@angular/core';
import { MatDialogRef, MatDialogTitle, MatDialogContent } from '@angular/material/dialog';
import { UntypedFormControl, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
    selector: 'tickist-prompt-user-for-password-dialog',
    templateUrl: './prompt-user-for-password-dialog.component.html',
    styleUrls: ['./prompt-user-for-password-dialog.component.scss'],
    standalone: true,
    imports: [MatDialogTitle, MatDialogContent, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule]
})
export class PromptUserForPasswordDialogComponent implements OnInit {
    passwordFormGroup: UntypedFormGroup;

    constructor(public dialogRef: MatDialogRef<PromptUserForPasswordDialogComponent>) {
    }

    ngOnInit() {
        this.passwordFormGroup = new UntypedFormGroup({
            'password': new UntypedFormControl('',
                {validators: [Validators.required, Validators.minLength(6)]}),
        });
    }

    close(result) {
        this.dialogRef.close(result);
    }

    onSubmit(values) {
        this.dialogRef.close(values.password);
    }

}
