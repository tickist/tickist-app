import {Injectable} from '@angular/core';
import { Location } from '@angular/common';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {AuthActionTypes, FetchedLoginUser, Login, Logout} from '../actions/auth.actions';
import {map, mapTo, switchMap, tap} from 'rxjs/operators';
import {Router} from '@angular/router';
import {defer, of} from 'rxjs';
import {Store} from '@ngrx/store';
import {AppStore} from '../../store';
import {UserService} from '../services/user.service';
import {AddUser} from '../actions/user.actions';
import {ResetStore} from '../../tickist.actions';
import LogRocket from 'logrocket';
import {environment} from '../../../environments/environment';
import {AuthService} from '../services/auth.service';
import {AngularFirestore} from '@angular/fire/firestore';
import {signupRoutesName} from '../../modules/signup/routes-names';


@Injectable()
export class AuthEffects {

    @Effect()
    login$ = this.actions$
        .pipe(
            ofType<Login>(AuthActionTypes.LoginAction),
            tap(() => this.router.navigateByUrl('/')),
            map(action => new FetchedLoginUser({uid: action.payload.uid}))
        );

    @Effect()
    FetchedLoginUser$ = this.actions$
        .pipe(
            ofType<FetchedLoginUser>(AuthActionTypes.FetchedLoginUser),
            switchMap(action => {
                console.log(action);
                return this.db.collection('users').doc(action.payload.uid).get();
            }),
            tap((snapshot: any) => {
                if (environment.production) {
                    LogRocket.identify(snapshot.payload.data().id.toString(), {
                        name: snapshot.payload.data().username,
                        email: snapshot.payload.data().email,
                    });
                }
            }),
            map((snapshot: any) => {
                return new AddUser({user: {id: snapshot.id, ...snapshot.data()}});
            })
        );

    @Effect()
    logout$ = this.actions$.pipe(
        ofType<Logout>(AuthActionTypes.LogoutAction),
        switchMap(() => {
            return of(this.authService.logout());
        }),
        tap(() => {
            if (this.location.path().includes(signupRoutesName.SIGNUP)) {
                this.router.navigateByUrl(`/${signupRoutesName.SIGNUP}`);
            } else {
                this.router.navigateByUrl('/login');
            }

        }),
        mapTo(new ResetStore())
    );

    // @Effect({dispatch: false})
    // redirectToLoginPage$ = this.actions$.pipe(
    //     ofType<RedirectToLoginPage>(AuthActionTypes.RedirectToLoginPage),
    //     tap(() => {
    //         localStorage.removeItem('JWT');
    //         localStorage.removeItem('JWT_REFRESH');
    //         localStorage.removeItem('USER_ID');
    //         this.router.navigateByUrl('/login');
    //     })
    // );

    @Effect()
    init$ = defer(() => {
        return this.authService.authState$.pipe(
            map(state => {
                console.log(state);
                if (state !== null) {
                    return new FetchedLoginUser({uid: state.uid});
                }
                return new Logout();
            })
        );
    });

    constructor(private actions$: Actions, private router: Router, private authService: AuthService, private location: Location,
                private store: Store<AppStore>, private userService: UserService, private db: AngularFirestore) {
    }
}
