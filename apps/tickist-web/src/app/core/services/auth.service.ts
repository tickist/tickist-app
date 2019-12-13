import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {AppStore} from '../../store';
import {User as FirebaseUser} from 'firebase';
import {User, UserLogin} from '@data/users/models';
import {selectLoggedInUser} from '../selectors/user.selectors';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';


@Injectable()
export class AuthService {
    user$: Observable<User>;
    usersCollection: AngularFirestoreCollection;
    readonly authState$: Observable<FirebaseUser | null> = this.fireAuth.authState;

    constructor(private store: Store<AppStore>, private fireAuth: AngularFireAuth, private db: AngularFirestore) {
        this.user$ = this.store.pipe(
            select(selectLoggedInUser)
        );
        this.usersCollection = this.db.collection('users');
    }

    login(user: UserLogin) {
        return this.fireAuth.auth.signInWithEmailAndPassword(user.email, user.password);
        // return this.http.post(`${environment.apiUrl}/api-token-auth/`, user);
    }

    signup({email, password}) {
        return this.fireAuth.auth.createUserWithEmailAndPassword(email, password);
        // return this.http.post(`${environment.apiUrl}/registration/`, user);
    }

    logout() {
        return this.fireAuth.auth.signOut();
    }

    checkEmail(email) {
        // return this.http.post(`${environment.apiUrl}/check_email/`, {'email': email});

    }

    save({uid, username, email}) {
        const user = new User(<any> {id: uid, username: username, email: email});
        this.usersCollection.doc(uid).set({...user}).catch((err) => console.log(err));
    }


}


