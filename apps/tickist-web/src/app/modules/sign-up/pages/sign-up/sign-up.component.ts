import { Component, OnDestroy } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { AuthService } from "../../../auth/services/auth.service";
import { Router } from "@angular/router";
import { AngularFireAuth } from "@angular/fire/auth";
import { MatDialog } from "@angular/material/dialog";
import { Subject } from "rxjs";

@Component({
    selector: "tickist-sign-up",
    templateUrl: "./sign-up.component.html",
    styleUrls: ["./sign-up.component.scss"],
})
export class SignUpComponent implements OnDestroy {
    userForm: FormGroup;
    firebaseMessage = "";
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private authService: AuthService,
        private router: Router,
        private fireAuth: AngularFireAuth,
        public dialog: MatDialog
    ) {
        this.userForm = new FormGroup({
            username: new FormControl("", [Validators.required]),
            email: new FormControl(
                "",
                [Validators.required, Validators.email],
                []
            ),
            password: new FormControl("", [
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
