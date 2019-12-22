import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AuthService} from '../../../../core/services/auth.service';


@Component({
    selector: 'tickist-sign-up',
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
    userForm: FormGroup;
    firebaseMessage = '';

    constructor(private authService: AuthService) {
        this.userForm = new FormGroup({
            'username': new FormControl('', [Validators.required]),
            'email': new FormControl('', [Validators.required, Validators.email], []),
            'password': new FormControl('', [
                Validators.required,
                Validators.min(6),
                Validators.minLength(6)
            ])
        });
    }

    ngOnInit() {}

    onSubmit(values: any): void {
        if (this.userForm.valid) {
            this.authService.signup(values)
                .then((user) => {
                    console.log(user);
                    // @TODO move to action
                    this.authService.save({username: values.username, uid: user.user.uid, email: user.user.email});
                })
                .catch(
                    err => {
                        this.userForm.controls['email'].setErrors({'firebaseError': true});
                        this.firebaseMessage = err.message;
                    }
                );
        }
    }

}
