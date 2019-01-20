import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {environment} from '../../environments/environment';
import {AppStore} from '../store';
import {User, UserLogin, SimpleUser} from '../user/models';
import {HttpClient} from '@angular/common/http';
import {Logout} from './auth.actions';
import {selectLoggedInUser} from '../user/user.selectors';


@Injectable()
export class AuthService {
    user$: Observable<User>;

    constructor(private http: HttpClient, private store: Store<AppStore>) {
        this.user$ = this.store.pipe(
            select(selectLoggedInUser)
        );
    }

    isLoggedIn(): boolean {
        return localStorage.getItem('JWT') !== null;
    }

    login(user: UserLogin) {
        return this.http.post(`${environment.apiUrl}/api-token-auth/`, user);
    }

    signup(user: any) {
        return this.http.post(`${environment.apiUrl}/registration/`, user);
    }

    logout() {
        this.store.dispatch(new Logout());
    }

    checkEmail(email) {
        return this.http.post(`${environment.apiUrl}/check_email/`, {'email': email});

    }


}


