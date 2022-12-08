import { Component, OnDestroy } from "@angular/core";
import { UntypedFormControl, UntypedFormGroup, Validators } from "@angular/forms";
import { AuthService } from "../../../auth/services/auth.service";
import { MatLegacyDialog as MatDialog } from "@angular/material/legacy-dialog";
import { Subject } from "rxjs";

@Component({
    selector: "tickist-sign-up",
    templateUrl: "./sign-up.component.html",
    styleUrls: ["./sign-up.component.scss"],
})
export class SignUpComponent implements OnDestroy {
    userForm: UntypedFormGroup;
    firebaseMessage = "";
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(private authService: AuthService, public dialog: MatDialog) {
        this.userForm = new UntypedFormGroup({
            username: new UntypedFormControl("", [Validators.required]),
            email: new UntypedFormControl(
                "",
                [Validators.required, Validators.email],
                []
            ),
            password: new UntypedFormControl("", [
                Validators.required,
                Validators.min(6),
                Validators.minLength(6),
            ]),
        });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    onSubmit(values: any): void {
        if (this.userForm.valid) {
            this.authService
                .signup(values)
                .then((user) => {
                    // @TODO move to action
                    this.authService.save(
                        user.user.uid,
                        values.username,
                        user.user.email
                    );
                })
                .catch((err) => {
                    this.userForm.controls["email"].setErrors({
                        firebaseError: true,
                    });
                    this.firebaseMessage = err.message;
                });
        }
    }
}
