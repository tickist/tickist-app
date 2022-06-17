import { Component, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Store } from "@ngrx/store";
import { login } from "../../../../core/actions/auth.actions";
import { AuthService } from "../../../auth/services/auth.service";
import { signupRoutesName } from "../../../sign-up/routes-names";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { NGXLogger } from "ngx-logger";
import { OperationType } from "@firebase/auth";

@Component({
    selector: "tickist-login",
    templateUrl: "./login.component.html",
    styleUrls: ["./login.component.scss"],
})
export class LoginComponent implements OnDestroy {
    loginForm: FormGroup;
    message = "";
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(
        protected router: Router,
        private authService: AuthService,
        private store: Store,
        private logger: NGXLogger
    ) {
        this.loginForm = new FormGroup({
            email: new FormControl("", [Validators.required, Validators.email]),
            password: new FormControl("", Validators.required),
        });
        this.loginForm.controls["email"].valueChanges
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(() => {
                this.resetValidationError();
            });

        this.loginForm.controls["password"].valueChanges
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(() => {
                this.resetValidationError();
            });
    }

    private resetValidationError() {
        this.loginForm.controls["email"].setErrors(null);
        this.loginForm.controls["password"].setErrors(null);
    }

    getErrorMessage() {
        return this.loginForm.controls["email"].hasError("required")
            ? "You must enter a value"
            : this.loginForm.controls["email"].hasError("email")
            ? "Not a valid email"
            : "";
    }

    onSubmit(values: any) {
        this.authService
            .login(values)
            .then((user) => {
                this.logger.debug(user);
                this.store.dispatch(login({ uid: user.user.uid }));
            })
            .catch((err) => {
                this.logger.error(err);
                this.loginForm.controls["email"].setErrors({
                    incorrectLoginPassword: true,
                });
                this.loginForm.controls["password"].setErrors({
                    incorrectLoginPassword: true,
                });
                this.message = err.message;
            });
    }

    googleAuth(): void {
        this.authService.googleAuth().then((userCredential) => {
            this.logger.debug({ userCredential });
            if (userCredential.operationType === OperationType.SIGN_IN) {
                this.authService.save(
                    userCredential.user.uid,
                    userCredential.user.displayName,
                    userCredential.user.email,
                    {
                        avatarUrl: userCredential.user.providerData[0].photoURL,
                        isGoogleConnection: true,
                    }
                );
            } else {
                this.router.navigateByUrl("/");
            }
        });
    }

    facebookAuth(): void {
        this.authService.facebookAuth().then((user) => {});
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }
}
