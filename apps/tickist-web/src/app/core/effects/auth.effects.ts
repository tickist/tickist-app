import {Injectable} from '@angular/core';
import {Location} from '@angular/common';
import {Actions, createEffect, Effect, ofType} from '@ngrx/effects';
import {fetchedLoginUser, login, logout} from '../actions/auth.actions';
import {catchError, filter, map, mapTo, switchMap, tap, withLatestFrom} from 'rxjs/operators';
import {Router} from '@angular/router';
import {defer, of} from 'rxjs';
import {Store} from '@ngrx/store';
import {UserService} from '../services/user.service';
import {AddUser} from '../actions/user.actions';
import {ResetStore} from '../../tickist.actions';
import LogRocket from 'logrocket';
import {environment} from '@env/environment';
import {AuthService} from '../../modules/auth/services/auth.service';
import {AngularFirestore} from '@angular/fire/firestore';
import {signupRoutesName} from '../../modules/sign-up/routes-names';
import {User} from '@data/users/models';
import {resetPasswordRoutesName} from '../../modules/reset-password/routes-names';
import {firebaseError} from '../actions/errors.actions';
import {selectLoggedInUser} from '../selectors/user.selectors';


@Injectable()
export class AuthEffects {

    login$ = createEffect(() => this.actions$
        .pipe(
            ofType(login),
            tap(() => this.router.navigateByUrl('/')),
            map(action => fetchedLoginUser({uid: action.uid}))
        ));

    FetchedLoginUser$ = createEffect(() => this.actions$
        .pipe(
            ofType(fetchedLoginUser),
            withLatestFrom(this.store.select(selectLoggedInUser)),
            switchMap(([action, user]) => {
                console.log({user});

                return this.db.collection('users').doc(action.uid).get().pipe(
                    filter(snapshot => snapshot.exists),
                    tap((snapshot: any) => {
                        if (environment.production) {
                            LogRocket.identify(snapshot.id, {
                                name: snapshot.data().username,
                                email: snapshot.data().email,
                            });
                        }
                    }),
                    map((snapshot: any) => {
                        return new AddUser({user: new User({id: snapshot.id, ...snapshot.data()})});
                    }),
                    catchError((err) => {
                        return of(firebaseError({error: new Error(err)}));
                    })
                );
            })
        ));

    logout$ = createEffect(() => this.actions$.pipe(
        ofType(logout),
        switchMap(() => {
            return of(this.authService.logout());
        }),
        tap(() => {
            if (this.location.path().includes(signupRoutesName.SIGNUP)) {
                this.router.navigateByUrl(`/${signupRoutesName.SIGNUP}`);

            } else if (this.location.path().includes(resetPasswordRoutesName.RESET_PASSWORD)) {

                this.router.navigateByUrl(`/${this.location.path()}`);
            } else {
                this.router.navigateByUrl('/login').catch((error) => console.log(error));
            }

        }),
        mapTo(new ResetStore())
    ));

    @Effect()
    init$ = defer(() => {
        return this.authService.authState$.pipe(
            map(state => {
                if (state !== null) {
                    return fetchedLoginUser({uid: state.uid});
                }
                return logout();
            })
        );
    });

    constructor(private actions$: Actions, private router: Router, private authService: AuthService, private location: Location,
                private store: Store, private userService: UserService, private db: AngularFirestore) {
    }
}
