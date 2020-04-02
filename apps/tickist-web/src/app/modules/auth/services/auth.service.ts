import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {User as FirebaseUser} from 'firebase';
import {User, UserLogin} from '@data/users/models';
import {selectLoggedInUser} from '../../../core/selectors/user.selectors';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {FetchedLoginUser} from '../../../core/actions/auth.actions';
import {Router} from '@angular/router';
import { auth } from 'firebase/app';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    user$: Observable<User>;
    usersCollection: AngularFirestoreCollection;
    readonly authState$: Observable<FirebaseUser | null> = this.fireAuth.authState;

    constructor(private store: Store<{}>, private fireAuth: AngularFireAuth, private db: AngularFirestore, private router: Router) {
        this.user$ = this.store.pipe(
            select(selectLoggedInUser)
        );
        this.usersCollection = this.db.collection('users');
    }

    login(user: UserLogin) {
        return this.fireAuth.auth.signInWithEmailAndPassword(user.email, user.password);
    }

    facebookAuth() {
        return this.authLogin(new auth.FacebookAuthProvider())
    }

    googleAuth() {
        return this.authLogin(new auth.GoogleAuthProvider());
    }

    authLogin(provider) {
        return this.fireAuth.auth.signInWithPopup(provider)
    }

    signup({email, password}) {
        return this.fireAuth.auth.createUserWithEmailAndPassword(email, password);
    }

    logout() {
        return this.fireAuth.auth.signOut();
    }

    save(uid: string, username: string, email: string, additionalData?: Partial<User>) {
        const user = new User(<any> {id: uid, username, email, ...additionalData});
        this.usersCollection.doc(uid).set(JSON.parse(JSON.stringify(user)))
            .then(() => {
                this.store.dispatch(new FetchedLoginUser({uid: uid}));
                this.router.navigateByUrl('/');
            })
            .catch((err) => console.log(err));
    }

    getProviderForId(id) {
        switch (id) {
            case auth.GoogleAuthProvider.PROVIDER_ID:
                return new auth.GoogleAuthProvider();
            case auth.FacebookAuthProvider.PROVIDER_ID:
                return new auth.FacebookAuthProvider();
        }
    }
}


