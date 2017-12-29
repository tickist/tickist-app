import {Component, OnInit} from '@angular/core';
import {UserService} from '../services/userService'
import {Response} from '@angular/http';
import {UserLogin} from '../models/user';
import {Router} from '@angular/router';
import {FormGroup, FormBuilder, Validators, FormControl, AbstractControl} from '@angular/forms';


@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
    loginForm: FormGroup;

    constructor(protected router: Router, private userService: UserService) {
        this.loginForm = new FormGroup({
            'email': new FormControl('', [Validators.required, Validators.email]),
            'password': new FormControl('', Validators.required)
        });
        this.loginForm.controls['email'].valueChanges.subscribe(() => {
            this.resetValidationError();
        });

        this.loginForm.controls['password'].valueChanges.subscribe(() => {
            this.resetValidationError();
        });
    }

    private resetValidationError() {
        this.loginForm.controls['email'].setErrors(null);
        this.loginForm.controls['password'].setErrors(null);
    }

    ngOnInit() {
    }

    getErrorMessage() {
        return this.loginForm.controls['email'].hasError('required') ? 'You must enter a value' :
            this.loginForm.controls['email'].hasError('email') ? 'Not a valid email' :
                '';
    }

    onSubmit(values: any) {
        console.log(values);
        this.userService.login(values).subscribe(
            (response: Response) => { // on sucesss
                console.log(response);
                this.router.navigate(['home']);
            },
            (err: any) => { // on error
                this.loginForm.controls['email'].setErrors({'incorrectLoginPassword': true});
                this.loginForm.controls['password'].setErrors({'incorrectLoginPassword': true});
            },
            () => { // on completion

            }
        );
    }

}
