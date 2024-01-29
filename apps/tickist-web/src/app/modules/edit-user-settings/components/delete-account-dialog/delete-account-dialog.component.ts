import { Component, OnDestroy, OnInit } from "@angular/core";
import { MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from "@angular/material/dialog";
import { UntypedFormControl, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Auth, onAuthStateChanged } from "@angular/fire/auth";
import { Subject } from "rxjs";
import { Store } from "@ngrx/store";
import { logout } from "../../../../core/actions/auth.actions";
import { EmailAuthProvider, reauthenticateWithCredential, User } from "firebase/auth";
import { DataCyDirective } from "../../../../shared/directives/data-cy.directive";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";

@Component({
    selector: "tickist-delete-account-dialog",
    templateUrl: "./delete-account-dialog.component.html",
    styleUrls: ["./delete-account-dialog.component.scss"],
    standalone: true,
    imports: [
        MatDialogTitle,
        MatDialogContent,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatDialogActions,
        MatButtonModule,
        DataCyDirective,
    ],
})
export class DeleteAccountDialogComponent implements OnInit, OnDestroy {
    passwordFormGroup: UntypedFormGroup;
    user: User;
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    constructor(public dialogRef: MatDialogRef<DeleteAccountDialogComponent>, private authFire: Auth, private store: Store) {}

    ngOnInit(): void {
        onAuthStateChanged(this.authFire, (user) => {
            if (user) {
                this.user = user as User;
            }
        });
        this.passwordFormGroup = new UntypedFormGroup({
            password: new UntypedFormControl("", {
                validators: [Validators.required],
            }),
        });
    }

    deleteMyAccount() {
        const credentials = EmailAuthProvider.credential(this.user.email, this.passwordFormGroup.get("password").value);
        reauthenticateWithCredential(this.user, credentials)
            .then(() => {
                this.dialogRef.close();
                this.user.delete();
                this.store.dispatch(logout());
            })
            .catch((err) => {
                alert(err.message);
            });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }
}
