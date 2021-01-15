import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatDialogRef} from "@angular/material/dialog";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {AngularFireAuth} from "@angular/fire/auth";
import {takeUntil} from "rxjs/operators";
import {Subject} from "rxjs";
import {Store} from "@ngrx/store";
import {logout} from "../../../../core/actions/auth.actions";
import firebase from "firebase/app";

@Component({
    selector: 'tickist-delete-account-dialog',
    templateUrl: './delete-account-dialog.component.html',
    styleUrls: ['./delete-account-dialog.component.scss']
})
export class DeleteAccountDialogComponent implements OnInit, OnDestroy {
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    passwordFormGroup: FormGroup
    user: firebase.User;

    constructor(public dialogRef: MatDialogRef<DeleteAccountDialogComponent>, private authFire: AngularFireAuth, private store: Store) {
    }

    ngOnInit(): void {
        this.authFire.user.pipe(
            takeUntil(this.ngUnsubscribe)
        ).subscribe((user) => this.user = user)
        this.passwordFormGroup = new FormGroup({
                password: new FormControl('', {validators: [Validators.required]})
            }
        )
    }

    deleteMyAccount() {
        const credentials  = firebase.auth.EmailAuthProvider.credential(
            this.user.email,
            this.passwordFormGroup.get('password').value
        );
        this.user.reauthenticateWithCredential(credentials).then(() => {
                this.dialogRef.close();
                this.user.delete();
                this.store.dispatch(logout());
            }
        ).catch((err) => {
            alert(err.message)
        })

    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

}
