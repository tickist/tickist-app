import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {User, UserLogin} from '@data/users/models';
import {selectLoggedInUser} from '../../../core/selectors/user.selectors';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {fetchedLoginUser} from '../../../core/actions/auth.actions';
import {Router} from '@angular/router';
import firebase from 'firebase/app';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    user$: Observable<User>;
    usersCollection: AngularFirestoreCollection;
    readonly authState$: Observable<firebase.User | null> = this.fireAuth.authState;

    constructor(private store: Store, private fireAuth: AngularFireAuth, private db: AngularFirestore, private router: Router) {
        this.user$ = this.store.pipe(
            select(selectLoggedInUser)
        );
        this.usersCollection = this.db.collection('users');
    }

    login(user: UserLogin) {
        return this.fireAuth.signInWithEmailAndPassword(user.email, user.password);
    }

    facebookAuth() {
        return this.authLogin(new firebase.auth.FacebookAuthProvider())
    }

    googleAuth() {
        return this.authLogin(new firebase.auth.GoogleAuthProvider());
    }

    authLogin(provider) {
        return this.fireAuth.signInWithPopup(provider)
    }

    signup({email, password}) {
        return this.fireAuth.createUserWithEmailAndPassword(email, password);
    }

    logout() {
        return this.fireAuth.signOut();
    }

    save(uid: string, username: string, email: string, additionalData?: Partial<User>) {
        const user = new User(<any> {id: uid, username, email, ...additionalData});
        this.usersCollection.doc(uid).set(JSON.parse(JSON.stringify(user)))
            .then(() => {
                this.store.dispatch(fetchedLoginUser({uid: uid}));
                this.router.navigateByUrl('/');
            })
            .catch((err) => {
                console.log(err)
            });
    }

    getProviderForId(id) {
        switch (id) {
            case firebase.auth.GoogleAuthProvider.PROVIDER_ID:
                return new firebase.auth.GoogleAuthProvider();
            case firebase.auth.FacebookAuthProvider.PROVIDER_ID:
                return new firebase.auth.FacebookAuthProvider();
        }
    }
}


