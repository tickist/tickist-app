import {Component, OnInit} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {FormControl, FormGroup, Validators} from '@angular/forms';

@Component({
    selector: 'tickist-prompt-user-for-password-dialog',
    templateUrl: './prompt-user-for-password-dialog.component.html',
    styleUrls: ['./prompt-user-for-password-dialog.component.css']
})
export class PromptUserForPasswordDialogComponent implements OnInit {
    passwordFormGroup: FormGroup;

    constructor(public dialogRef: MatDialogRef<PromptUserForPasswordDialogComponent>) {
    }

    ngOnInit() {
        this.passwordFormGroup = new FormGroup({
            'password': new FormControl('',
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
