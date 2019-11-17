import {TestBed} from '@angular/core/testing';
import {provideMockActions} from '@ngrx/effects/testing';
import {Observable, ReplaySubject} from 'rxjs';

import {UserEffects} from './user.effects';
import {StoreModule} from '@ngrx/store';
import {UserService} from '../services/user.service';
import {AngularFireModule} from '@angular/fire';
import {AngularFireAuthModule} from '@angular/fire/auth';
import {AngularFirestoreModule} from '@angular/fire/firestore';
import {environment} from '@env/environment.dev';

class UserServiceMock {

}

describe('UserEffects', () => {
    let actions$: Observable<any>;
    let effects: UserEffects;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                StoreModule.forRoot({}),
                AngularFireModule.initializeApp(environment.firebase),
                AngularFireAuthModule,
                AngularFirestoreModule
            ],
            providers: [
                UserEffects,
                {provide: UserService, useClass: UserServiceMock},
                provideMockActions(() => actions$)
            ]
        });

        effects = TestBed.get(UserEffects);
        actions$ = new ReplaySubject(1);
    });

    it('should be created', () => {
        expect(effects).toBeTruthy();
    });
});
