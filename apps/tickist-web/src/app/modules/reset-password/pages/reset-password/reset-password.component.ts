import { Component, OnInit } from "@angular/core";
import { Auth } from "@angular/fire/auth";
import { UntypedFormBuilder, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { UserService } from "../../../../core/services/user.service";
import { MatButtonModule } from "@angular/material/button";
import { ExtendedModule } from "@ngbracket/ngx-layout/extended";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { NgIf, NgClass } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { FlexModule } from "@ngbracket/ngx-layout/flex";

@Component({
    selector: "tickist-reset-password",
    templateUrl: "./reset-password.component.html",
    styleUrls: ["./reset-password.component.scss"],
    standalone: true,
    imports: [
        FlexModule,
        MatCardModule,
        FormsModule,
        ReactiveFormsModule,
        NgIf,
        MatFormFieldModule,
        MatInputModule,
        NgClass,
        ExtendedModule,
        MatButtonModule,
    ],
})
export class ResetPasswordComponent implements OnInit {
    setNewPasswordForm: UntypedFormGroup;
    code: string;

    constructor(
        private afAuth: Auth,
        private fb: UntypedFormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private userService: UserService
    ) {
        this.setNewPasswordForm = this.fb.group(
            {
                password: ["", [Validators.required]],
                confirmPassword: ["", [Validators.required]],
            },
            { validators: this.matchingPasswords }
        );
    }

    ngOnInit() {
        this.code = this.route.snapshot.queryParams["oobCode"];
    }

    changePassword($event, values) {
        this.userService
            .changePassword(values.password, this.code)
            .then(() => this.router.navigate(["login"]))
            .catch((err) => {
                const errorMessage = FirebaseErrors.Parse(err.code);
                console.log({ errorMessage }); // check this helper class at the bottom
            });
    }

    private matchingPasswords(group: any) {
        const password = group.controls.password;
        const confirmPassword = group.controls.confirmPassword;
        let result = null;
        if (password.value !== confirmPassword.value) {
            result = {
                mismatchedPasswords: true,
            };
        }
        return result;
    }
}

export class FirebaseErrors {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    static Parse(errorCode: string): string {
        let message: string;

        switch (errorCode) {
            case "auth/wrong-password":
                message = "Invalid login credentials.";
                break;
            case "auth/network-request-failed":
                message = "Please check your internet connection";
                break;
            case "auth/too-many-requests":
                message = "We have detected too many requests from your device. Take a break please!";
                break;
            case "auth/user-disabled":
                message = "Your account has been disabled or deleted. Please contact the system administrator.";
                break;
            case "auth/requires-recent-login":
                message = "Please login again and try again!";
                break;
            case "auth/email-already-exists":
                message = "Email address is already in use by an existing user.";
                break;
            case "auth/user-not-found":
                message = "We could not find user account associated with the email address or phone number.";
                break;
            case "auth/phone-number-already-exists":
                message = "The phone number is already in use by an existing user.";
                break;
            case "auth/invalid-phone-number":
                message = "The phone number is not a valid phone number!";
                break;
            case "auth/invalid-email  ":
                message = "The email address is not a valid email address!";
                break;
            case "auth/cannot-delete-own-user-account":
                message = "You cannot delete your own user account.";
                break;
            default:
                message = "Oops! Something went wrong. Try again later.";
                break;
        }

        return message;
    }
}
