import { Component, OnDestroy } from "@angular/core";
import { UntypedFormControl, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { AuthService } from "../../../auth/services/auth.service";
import {  MatDialog } from "@angular/material/dialog";
import { Subject } from "rxjs";
import { PrivacyPolicyComponent } from "../../../../core/footer/privacy-policy/privacy-policy.component";
import { RouterLink } from "@angular/router";
import { FacebookConnectComponent } from "../../../auth/components/facebook-connect/facebook-connect.component";
import { GoogleConnectComponent } from "../../../auth/components/google-connect/google-connect.component";
import { MatButtonModule } from "@angular/material/button";
import { NgIf } from "@angular/common";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatCardModule } from "@angular/material/card";
import { FlexModule } from "@ngbracket/ngx-layout/flex";

@Component({
    selector: "tickist-sign-up",
    templateUrl: "./sign-up.component.html",
    styleUrls: ["./sign-up.component.scss"],
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
