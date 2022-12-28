import { Component, OnDestroy, OnInit } from "@angular/core";
import {  MatDialogRef } from "@angular/material/dialog";
import { UntypedFormControl, UntypedFormGroup, Validators } from "@angular/forms";
import { Auth, onAuthStateChanged } from "@angular/fire/auth";
import { Subject } from "rxjs";
import { Store } from "@ngrx/store";
import { logout } from "../../../../core/actions/auth.actions";
import {
    EmailAuthProvider,
    reauthenticateWithCredential,
    User,
} from "firebase/auth";

@Component({
    selector: "tickist-delete-account-dialog",
    templateUrl: "./delete-account-dialog.component.html",
    styleUrls: ["./delete-account-dialog.component.scss"],
})
export class DeleteAccountDialogComponent implements OnInit, OnDestroy {
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    passwordFormGroup: UntypedFormGroup;
    user: User;

    constructor(
        public dialogRef: MatDialogRef<DeleteAccountDialogComponent>,
        private authFire: Auth,
        private store: Store
    ) {}

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
        const credentials = EmailAuthProvider.credential(
            this.user.email,
            this.passwordFormGroup.get("password").value
        );
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
