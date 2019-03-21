import {Component, OnInit} from '@angular/core';
import {
    FormGroup,
    FormControl,
    Validators,
    AbstractControl
} from '@angular/forms';
import {UserService} from '../../../../core/services/user.service';
import {Router} from '@angular/router';
import {map, tap} from 'rxjs/operators';
import {noop, pipe} from 'rxjs';
import {IToken, Token} from '../../../../core/models/auth';
import {Login} from '../../../../core/actions/auth.actions';
import {AppStore} from '../../../../store';
import {Store} from '@ngrx/store';
import {AuthService} from '../../../../core/services/auth.service';


@Component({
    selector: 'tickist-sign-up',
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
    userForm: FormGroup;

    constructor( private authService: AuthService, private router: Router, private store: Store<AppStore>) {
        this.userForm = new FormGroup({
            'username': new FormControl('', [Validators.required]),
            'email': new FormControl('', [Validators.required, Validators.email], [this.validateEmailNotTaken.bind(this)]),
            'password': new FormControl('', [Validators.required])
        });
    }

    ngOnInit() {
    }

    validateEmailNotTaken(control: AbstractControl) {
        return this.authService.checkEmail(control.value).pipe(map(res => {
            if (res['is_taken']) {
                return {emailTaken: true};
            }
        }));
    }

    onSubmit(values: any): void {
        this.authService.signup(values).pipe(
            tap((token: IToken) => {
                this.store.dispatch(new Login({token: new Token(token)} ));
            })
        ).subscribe(
            noop,
            (err: any) => { // on error
                console.log(err);
            }
        );
    }

}
