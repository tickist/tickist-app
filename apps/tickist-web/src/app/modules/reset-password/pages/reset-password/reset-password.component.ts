import {Component, OnInit} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
    selector: 'tickist-reset-password',
    templateUrl: './reset-password.component.html',
    styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
    frmSetNewPassword: FormGroup;
    constructor(private afAuth: AngularFireAuth, private fb: FormBuilder, private route: ActivatedRoute, private router: Router) {}

    ngOnInit() {
        this.frmSetNewPassword = this.fb.group({
            password: ['', [Validators.required]],
            confirmPassword: ['', [Validators.required]]
        });
    }

    private matchingPasswords(group: any) {
        const password = group.controls.password;
        const newPassword = group.controls.newPassword;
        const repeatNewPassword = group.controls.repeatNewPassword;
        let result = null;
        if (newPassword.value !== repeatNewPassword.value) {
            result = {
                mismatchedPasswords: true
            };
        }
        if (password.value === newPassword.value) {
            result = {
                oldSameNew: true
            };
        }
        return result;
    }
}
