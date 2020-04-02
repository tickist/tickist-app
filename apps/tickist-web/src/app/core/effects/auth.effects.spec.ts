import {TestBed} from '@angular/core/testing';
import {provideMockActions} from '@ngrx/effects/testing';
import {Observable, ReplaySubject} from 'rxjs';

import {AuthEffects} from './auth.effects';
import {StoreModule} from '@ngrx/store';
import {UserService} from '../services/user.service';
import {RouterTestingModule} from '@angular/router/testing';
import {AuthService} from '../../modules/auth/services/auth.service';
import {AngularFireModule} from '@angular/fire';
import {AngularFireAuthModule} from '@angular/fire/auth';
import {AngularFirestoreModule} from '@angular/fire/firestore';
import {environment} from '@env/environment.dev';

class UserServiceMock {}

describe('Effects', () => {
    let actions$: Observable<any>;
    let effects: AuthEffects;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                StoreModule.forRoot({}),
                RouterTestingModule,
                AngularFireModule.initializeApp(environment.firebase),
                AngularFireAuthModule,
                AngularFirestoreModule
            ],
            providers: [
                AuthEffects,
                provideMockActions(() => actions$),
                {provide: UserService, useValue: UserServiceMock},
                {provide: AuthService, useValue: AuthService}
            ]
        });

        effects = TestBed.get(AuthEffects);
        actions$ = new ReplaySubject(1);
    });

    it('should be created', () => {
        expect(effects).toBeTruthy();
    });
});
