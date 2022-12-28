import {Component, OnInit} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';

@Component({
    selector: 'tickist-prompt-user-for-password-dialog',
    templateUrl: './prompt-user-for-password-dialog.component.html',
    styleUrls: ['./prompt-user-for-password-dialog.component.scss']
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
