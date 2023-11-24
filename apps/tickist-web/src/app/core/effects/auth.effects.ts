import { Injectable } from "@angular/core";
import { Location } from "@angular/common";
import { Actions, concatLatestFrom, createEffect, ofType } from "@ngrx/effects";
import { fetchedLoginUser, login, logout } from "../actions/auth.actions";
import { catchError, filter, map, mapTo, switchMap, tap } from "rxjs/operators";
import { Router } from "@angular/router";
import { defer, of } from "rxjs";
import { Store } from "@ngrx/store";
import { UserService } from "../services/user.service";
import { addUser } from "../actions/user.actions";
import { resetStore } from "../../tickist.actions";
import { AuthService } from "../../modules/auth/services/auth.service";
import { signupRoutesName } from "../../modules/sign-up/routes-names";
import { User } from "@data/users/models";
import { resetPasswordRoutesName } from "../../modules/reset-password/routes-names";
import { firebaseError } from "../actions/errors.actions";
import { selectLoggedInUser } from "../selectors/user.selectors";
import { NGXLogger } from "ngx-logger";
import { doc, docSnapshots, Firestore } from "@angular/fire/firestore";

@Injectable()
export class AuthEffects {
    login$ = createEffect(() =>
        this.actions$.pipe(
            ofType(login),
            tap(() => this.router.navigateByUrl("/")),
            map((action) => fetchedLoginUser({ uid: action.uid })),
        ),
    );

    fetchedLoginUser$ = createEffect(() =>
        this.actions$.pipe(
            ofType(fetchedLoginUser),
            concatLatestFrom(() => this.store.select(selectLoggedInUser)),
            switchMap(([action]) => {
                const docRef = doc(this.firestore, `users/${action.uid}`);
                return docSnapshots(docRef).pipe(
                    filter((snapshot: any) => snapshot.exists),
                    map((snapshot: any) =>
                        addUser({
                            user: new User({
                                id: snapshot.id,
                                ...snapshot.data(),
                            }),
                        }),
                    ),
                    catchError((err) => of(firebaseError({ error: new Error(err) }))),
                );
            }),
        ),
    );

    logout$ = createEffect(() =>
        this.actions$.pipe(
            ofType(logout),
            switchMap(() => of(this.authService.logout())),
            tap(() => {
                if (this.location.path().includes(signupRoutesName.signUp)) {
                    this.router.navigateByUrl(`/${signupRoutesName.signUp}`);
                } else if (this.location.path().includes(resetPasswordRoutesName.resetPassword)) {
                    this.router.navigateByUrl(`/${this.location.path()}`);
                } else {
                    this.router.navigateByUrl("/login").catch((error) => this.logger.error(error));
                }
            }),
            mapTo(resetStore()),
        ),
    );

    init$ = createEffect(() =>
        defer(() =>
            this.authService.authState$.pipe(
                map((state) => {
                    console.log({ state });
                    if (state !== null) {
                        return fetchedLoginUser({ uid: state.uid });
                    }
                    return logout();
                }),
            ),
        ),
    );

    constructor(
        private actions$: Actions,
        private router: Router,
        private authService: AuthService,
        private location: Location,
        private store: Store,
        private userService: UserService,
        private firestore: Firestore,
        private logger: NGXLogger,
    ) {}
}
