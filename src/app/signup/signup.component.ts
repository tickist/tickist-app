import {Component, OnInit} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    FormControl,
    Validators,
    AbstractControl
} from '@angular/forms';
import {UserService} from '../services/user.service';
import {Router} from '@angular/router';
import {map} from 'rxjs/operators';
import {pipe} from 'rxjs';

class User {
    username: string;
    email: string;
    password: string;
}


@Component({
    selector: 'tickist-sign-up',
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {

    model = new User();
    userForm: FormGroup;

    constructor( private userService: UserService, protected router: Router) {
        this.userForm = new FormGroup({
            'username': new FormControl('', [Validators.required]),
            'email': new FormControl('', [Validators.required, Validators.email], [this.validateEmailNotTaken.bind(this)]),
            'password': new FormControl('', [Validators.required])
        });
    }

    ngOnInit() {
    }

    validateEmailNotTaken(control: AbstractControl) {
        return this.userService.checkEmail(control.value).pipe(map(res => {
            if (res['is_taken']) {
                return {emailTaken: true};
            }
        }));
    }

    onSubmit(values: any): void {
        this.userService.signup(values).subscribe(
            (response: Response) => { // on sucesss
                console.log(response);
                this.router.navigate(['home']);
            },
            (err: any) => { // on error
                console.log(err);
            },
            () => { // on completion

            }
        );
    }

}
