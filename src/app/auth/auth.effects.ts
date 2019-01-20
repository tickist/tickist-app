import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {AuthActionTypes, FetchedLoginUser, Login, Logout} from './auth.actions';
import {tap, mergeMap, map, mapTo} from 'rxjs/operators';
import {Router} from '@angular/router';
import {defer, of} from 'rxjs';
import {Store} from '@ngrx/store';
import {AppStore} from '../store';
import {UserService} from '../user/user.service';
import {AddUser} from '../user/user.actions';
import {User} from '../user/models';
import {IToken, Token} from './models';
import {debug} from 'util';
import {ResetStore} from '../tickist.actions';



@Injectable()
export class AuthEffects {

    @Effect()
    login$ = this.actions$
        .pipe(
            ofType<Login>(AuthActionTypes.LoginAction),
            tap(action => {
                localStorage.setItem('JWT', `JWT ${action.payload.token.access}`);
                localStorage.setItem('JWT_REFRESH', `JWT ${action.payload.token.refresh}`);
                localStorage.setItem('USER_ID', action.payload.token.userId.toString());
            }),
            mergeMap(action => this.userService.loadUser(action.payload.token.userId)),
            map((user: User) => {
                return new AddUser({user: user});
            }),
            tap(() => this.router.navigateByUrl('/'))
        );

    @Effect()
    FetchedLoginUser$ = this.actions$
        .pipe(
            ofType<FetchedLoginUser>(AuthActionTypes.FetchedLoginUser),
            mergeMap(action => this.userService.loadUser(action.payload.token.userId)),
            map((user: User) => {
                return new AddUser({user: user});
            })
        );

    @Effect()
    logout$ = this.actions$.pipe(
        ofType<Logout>(AuthActionTypes.LogoutAction),
        tap(() => {
            localStorage.removeItem('JWT');
            localStorage.removeItem('JWT_REFRESH');
            localStorage.removeItem('USER_ID');
            this.router.navigateByUrl('/login');
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
        const token: IToken = {
            access: localStorage.getItem('JWT'),
            refresh: localStorage.getItem('JWT_REFRESH'),
            user_id: parseInt(localStorage.getItem('USER_ID'), 10)
        };

        if (token && token.access) {
            return of(new FetchedLoginUser({token: new Token(token)}));
        } else {
            return <any>of(new Logout());
        }

    });

    constructor(private actions$: Actions, private router: Router,
                private store: Store<AppStore>, private userService: UserService) {


    }


}
