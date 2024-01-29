import { Component, OnDestroy } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { UntypedFormControl, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Store } from "@ngrx/store";
import { login } from "../../../../core/actions/auth.actions";
import { AuthService } from "../../../auth/services/auth.service";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { NGXLogger } from "ngx-logger";
import { OperationType } from "@firebase/auth";
import { PrivacyPolicyComponent } from "../../../../core/footer/privacy-policy/privacy-policy.component";
import { FacebookConnectComponent } from "../../../auth/components/facebook-connect/facebook-connect.component";
import { GoogleConnectComponent } from "../../../auth/components/google-connect/google-connect.component";
import { MatButtonModule } from "@angular/material/button";
import { NgIf } from "@angular/common";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatCardModule } from "@angular/material/card";
import { FlexModule } from "@ngbracket/ngx-layout/flex";

@Component({
    selector: "tickist-login",
    templateUrl: "./login.component.html",
    styleUrls: ["./login.component.scss"],
    standalone: true,
    imports: [
        FlexModule,
        MatCardModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        NgIf,
        MatButtonModule,
        GoogleConnectComponent,
        FacebookConnectComponent,
        RouterLink,
        PrivacyPolicyComponent,
    ],
})
export class LoginComponent implements OnDestroy {
    loginForm: UntypedFormGroup;
    message = "";
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(protected router: Router, private authService: AuthService, private store: Store, private logger: NGXLogger) {
        this.loginForm = new UntypedFormGroup({
            email: new UntypedFormControl("", [Validators.required, Validators.email]),
            password: new UntypedFormControl("", Validators.required),
        });
        this.loginForm.controls["email"].valueChanges.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
            this.resetValidationError();
        });

        this.loginForm.controls["password"].valueChanges.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
            this.resetValidationError();
        });
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
                this.authService.save(userCredential.user.uid, userCredential.user.displayName, userCredential.user.email, {
                    avatarUrl: userCredential.user.providerData[0].photoURL,
                    isGoogleConnection: true,
                });
            } else {
                this.router.navigateByUrl("/");
            }
        });
    }

    facebookAuth(): void {
        this.authService.facebookAuth().then((user) => {
            console.log({ user });
        });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    private resetValidationError() {
        this.loginForm.controls["email"].setErrors(null);
        this.loginForm.controls["password"].setErrors(null);
    }
}
