import {Component, OnDestroy, OnInit} from '@angular/core';
import {PromptUserForPasswordDialogComponent} from '../prompt-user-for-password-dialog/prompt-user-for-password-dialog.component';
import {takeUntil} from 'rxjs/operators';
import {AuthService} from '../../services/auth.service';
import {Router} from '@angular/router';
import {AngularFireAuth} from '@angular/fire/auth';
import {MatDialog} from '@angular/material/dialog';
import {Subject} from 'rxjs';

@Component({
    selector: 'tickist-facebook-connect',
    templateUrl: './facebook-connect.component.html',
    styleUrls: ['./facebook-connect.component.scss']
})
export class FacebookConnectComponent implements OnInit, OnDestroy {
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(private authService: AuthService, private router: Router, private fireAuth: AngularFireAuth, public dialog: MatDialog) {
    }

    ngOnInit() {
    }

    async facebookAuth(): Promise<void> {
        try {
            const user = await this.authService.facebookAuth();
            if (user.additionalUserInfo.isNewUser) {
                this.authService.save(
                    user.user.uid,
                    (user.additionalUserInfo.profile as any).name,
                    user.user.email,
                    {
                        avatarUrl: (user.additionalUserInfo.profile as any).picture.hasOwnProperty('url') ?
                            (user.additionalUserInfo.profile as any).picture.url : (user.additionalUserInfo.profile as any).picture,
                        isFacebookConnection: true
                    });
            } else {
                this.router.navigateByUrl('/');
            }
        } catch (error) {
            if (error.code === 'auth/account-exists-with-different-credential') {
                const pendingCred = error.credential;
                const email = error.email;
                const methods = await this.fireAuth.fetchSignInMethodsForEmail(email);
                if (methods[0] === 'password') {
                    const dialogRef = this.dialog.open(PromptUserForPasswordDialogComponent);
                    dialogRef.afterClosed().pipe(
                        takeUntil(this.ngUnsubscribe)
                    ).subscribe(async password => {
                        const userCredential = await this.fireAuth.signInWithEmailAndPassword(email, password);
                        await userCredential.user.linkWithCredential(pendingCred);

                        return this.router.navigateByUrl('/');

                    });
                } else {
                    const provider = this.authService.getProviderForId(methods[0]);
                    const userCredentials = await this.fireAuth.signInWithPopup(provider);
                    await userCredentials.user.linkWithCredential(pendingCred);

                    await this.router.navigateByUrl('/');
                }
            }
        }
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

}
