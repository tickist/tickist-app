import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AuthService} from '../../../../core/services/auth.service';
import {AngularFirestore} from '@angular/fire/firestore';
import {Router} from '@angular/router';


@Component({
    selector: 'tickist-sign-up',
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
    userForm: FormGroup;
    firebaseMessage = '';

    constructor(private authService: AuthService, private router: Router) {
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

    ngOnInit() {
    }

    onSubmit(values: any): void {
        if (this.userForm.valid) {
            this.authService.signup(values)
                .then((user) => {
                    // @TODO move to action
                    this.authService.save(
                        user.user.uid,
                        values.username,
                        user.user.email
                    );
                })
                .catch(
                    err => {
                        this.userForm.controls['email'].setErrors({'firebaseError': true});
                        this.firebaseMessage = err.message;
                    }
                );
        }
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
        this.authService.facebookAuth().then(user => {
            console.log({user});
            if (user.additionalUserInfo.isNewUser) {
                this.authService.save(
                    user.user.uid,
                    (user.additionalUserInfo.profile as any).name,
                    user.user.email,
                    {
                        avatarUrl: (user.additionalUserInfo.profile as any).picture,
                        isFacebookConnection: true
                    });
            }
        });
    }

}
