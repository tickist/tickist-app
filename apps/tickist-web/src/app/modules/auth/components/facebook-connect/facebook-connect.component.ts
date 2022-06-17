import { Component, OnDestroy } from "@angular/core";
import { PromptUserForPasswordDialogComponent } from "../prompt-user-for-password-dialog/prompt-user-for-password-dialog.component";
import { takeUntil } from "rxjs/operators";
import { AuthService } from "../../services/auth.service";
import { Router } from "@angular/router";
import {
    Auth,
    fetchSignInMethodsForEmail,
    linkWithCredential,
    signInWithEmailAndPassword,
    signInWithPopup,
} from "@angular/fire/auth";
import { MatDialog } from "@angular/material/dialog";
import { Subject } from "rxjs";
import { OperationType } from "@firebase/auth";
import { NGXLogger } from "ngx-logger";

@Component({
    selector: "tickist-facebook-connect",
    templateUrl: "./facebook-connect.component.html",
    styleUrls: ["./facebook-connect.component.scss"],
})
export class FacebookConnectComponent implements OnDestroy {
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private authService: AuthService,
        private router: Router,
        private fireAuth: Auth,
        public dialog: MatDialog,
        private logger: NGXLogger
    ) {}

    async facebookAuth(): Promise<void> {
        try {
            const userCredential = await this.authService.facebookAuth();
            this.logger.debug({ userCredential });
            if (userCredential.operationType === OperationType.SIGN_IN) {
                this.authService.save(
                    userCredential.user.uid,
                    userCredential.user.displayName,
                    userCredential.user.email,
                    {
                        avatarUrl: userCredential.user.providerData[0].photoURL,
                        isFacebookConnection: true,
                    }
                );
            } else {
                this.router.navigateByUrl("/");
            }
        } catch (error) {
            if (
                error.code === "auth/account-exists-with-different-credential"
            ) {
                const pendingCred = error.credential;
                const email = error.email;
                const methods = await fetchSignInMethodsForEmail(
                    this.fireAuth,
                    email
                );
                if (methods[0] === "password") {
                    const dialogRef = this.dialog.open(
                        PromptUserForPasswordDialogComponent
                    );
                    dialogRef
                        .afterClosed()
                        .pipe(takeUntil(this.ngUnsubscribe))
                        .subscribe(async (password) => {
                            const userCredential =
                                await signInWithEmailAndPassword(
                                    this.fireAuth,
                                    email,
                                    password
                                );
                            await linkWithCredential(
                                userCredential.user,
                                pendingCred
                            );

                            return this.router.navigateByUrl("/");
                        });
                } else {
                    const provider = this.authService.getProviderForId(
                        methods[0]
                    );
                    const userCredentials = await signInWithPopup(
                        this.fireAuth,
                        provider
                    );
                    await linkWithCredential(userCredentials.user, pendingCred);

                    await this.router.navigateByUrl("/");
                }
            }
        }
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }
}
