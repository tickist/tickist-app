import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {UserService} from '../../../../core/services/user.service';

@Component({
    selector: 'tickist-request-reset-password',
    templateUrl: './request-reset-password.component.html',
    styleUrls: ['./request-reset-password.component.scss']
})
export class RequestResetPasswordComponent implements OnInit {
    requestChangePasswordForm: FormGroup;
    requestChangePasswordMessage: string;

    constructor(private userService: UserService) {
    }

    ngOnInit() {
        this.requestChangePasswordForm = new FormGroup({
            'email': new FormControl('', Validators.compose([Validators.required, Validators.email])),
        });
    }

    async requestChangePassword($event, values: any): Promise<void> {
        try {
            const result = await this.userService.requestChangePassword(values.email);
            console.log({result});
            this.requestChangePasswordMessage = 'Please check your inbox.';
        } catch (e) {
            console.log({e});
            this.requestChangePasswordMessage = 'Something goes wrong.';
        }
    }

}
