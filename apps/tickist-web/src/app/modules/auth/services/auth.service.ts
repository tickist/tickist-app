import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { select, Store } from "@ngrx/store";
import { User, UserLogin } from "@data/users/models";
import { selectLoggedInUser } from "../../../core/selectors/user.selectors";
import {
    Auth,
    authState,
    createUserWithEmailAndPassword,
    FacebookAuthProvider,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    signInWithPopup,
} from "@angular/fire/auth";
import { fetchedLoginUser } from "../../../core/actions/auth.actions";
import { Router } from "@angular/router";
import { NGXLogger } from "ngx-logger";

import {
    collection,
    doc,
    Firestore,
    setDoc,
    updateDoc,
} from "@angular/fire/firestore";

@Injectable({
    providedIn: "root",
})
export class AuthService {
    user$: Observable<User>;
    readonly authState$: Observable<any | null> = authState(this.fireAuth);

    constructor(
        private store: Store,
        private fireAuth: Auth,
        private firestore: Firestore,
        private router: Router,
        private logger: NGXLogger
    ) {
        this.user$ = this.store.pipe(select(selectLoggedInUser));
    }

    login(user: UserLogin) {
        return signInWithEmailAndPassword(
            this.fireAuth,
            user.email,
            user.password
        );
    }

    facebookAuth() {
        return this.authLogin(new FacebookAuthProvider());
    }

    googleAuth() {
        return this.authLogin(new GoogleAuthProvider());
    }

    authLogin(provider) {
        return signInWithPopup(this.fireAuth, provider);
    }

    signup({ email, password }) {
        return createUserWithEmailAndPassword(this.fireAuth, email, password);
    }

    logout() {
        return this.fireAuth.signOut();
    }

    async save(
        uid: string,
        username: string,
        email: string,
        additionalData?: Partial<User>
    ) {
        const user = new User(<any>{
            id: uid,
            username,
            email,
            ...additionalData,
        });
        const docRef = doc(collection(this.firestore, `users`), uid);
        try {
            await setDoc(docRef, JSON.parse(JSON.stringify(user)));
            this.store.dispatch(fetchedLoginUser({ uid: uid }));
            this.router.navigateByUrl("/");
        } catch (err) {
            this.logger.error(err);
        }
    }

    getProviderForId(id) {
        switch (id) {
            case GoogleAuthProvider.PROVIDER_ID:
                return new GoogleAuthProvider();
            case FacebookAuthProvider.PROVIDER_ID:
                return new FacebookAuthProvider();
        }
    }
}
