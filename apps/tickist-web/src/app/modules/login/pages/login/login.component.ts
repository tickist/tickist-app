import {Component, OnDestroy} from '@angular/core';
import {Router} from '@angular/router';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Store} from '@ngrx/store';
import {Login} from '../../../../core/actions/auth.actions';
import {AuthService} from '../../../../core/services/auth.service';
import {signupRoutesName} from '../../../signup/routes-names';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';


@Component({
    selector: 'tickist-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnDestroy {
    loginForm: FormGroup;
    message = '';
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(protected router: Router, private authService: AuthService, private store: Store<{}>) {
        this.loginForm = new FormGroup({
            'email': new FormControl('', [Validators.required, Validators.email]),
            'password': new FormControl('', Validators.required)
        });
        this.loginForm.controls['email'].valueChanges.pipe(
            takeUntil(this.ngUnsubscribe)
        ).subscribe(() => {
            this.resetValidationError();
        });

        this.loginForm.controls['password'].valueChanges.pipe(
            takeUntil(this.ngUnsubscribe)
        ).subscribe(() => {
            this.resetValidationError();
        });
    }

    private resetValidationError() {
        this.loginForm.controls['email'].setErrors(null);
        this.loginForm.controls['password'].setErrors(null);
    }

    getErrorMessage() {
        return this.loginForm.controls['email'].hasError('required') ? 'You must enter a value' :
            this.loginForm.controls['email'].hasError('email') ? 'Not a valid email' :
                '';
    }

    onSubmit(values: any) {
        this.authService.login(values)
            .then((user) => {
                console.log(user);
                this.store.dispatch(new Login({uid: user.user.uid} ));
            })
            .catch(
                err => {
                    console.log(err.message);
                    this.loginForm.controls['email'].setErrors({'incorrectLoginPassword': true});
                    this.loginForm.controls['password'].setErrors({'incorrectLoginPassword': true});
                    this.message = err.message;
                }
            );
            // .pipe(
            //     tap((token: IToken) => {
            //         this.store.dispatch(new Login({token: new Token(token)} ));
            //     })
            // )
            // .subscribe(
            // noop,
            // (err: any) => { // on error

            // },
            // () => { // on completion
            //
            // }
    }

    navigateToSignUp() {
        this.router.navigate([signupRoutesName.SIGNUP]);
    }

    googleAuth(): void {
        this.authService.googleAuth().then(user => {
            console.log({user});
            if (user.additionalUserInfo.isNewUser) {
                this.authService.save(
                    user.user.uid,
                    (user.additionalUserInfo.profile as any).name,
                    user.user.email,
                    {
                        avatarUrl: (user.additionalUserInfo.profile as any).picture,
                        isGoogleConnection: true
                    });
            } else {
                this.router.navigateByUrl('/');
            }
        });
    }

    facebookAuth(): void {
        this.authService.facebookAuth();
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

}
