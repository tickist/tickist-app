import {TestBed, inject} from '@angular/core/testing';
import {provideMockActions} from '@ngrx/effects/testing';
import {Observable, ReplaySubject} from 'rxjs';

import {AuthEffects} from './auth.effects';
import {StoreModule} from '@ngrx/store';
import {RouterModule} from '@angular/router';
import {APP_BASE_HREF} from '@angular/common';
import {UserService} from '../services/user.service';
import {RouterTestingModule} from '@angular/router/testing';

class UserServiceMock {}

describe('Effects', () => {
    let actions$: Observable<any>;
    let effects: AuthEffects;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                StoreModule.forRoot({}),
                RouterTestingModule
            ],
            providers: [
                AuthEffects,
                provideMockActions(() => actions$),
                {provide: UserService, useValue: UserServiceMock}
            ]
        });

        effects = TestBed.get(AuthEffects);
        actions$ = new ReplaySubject(1);
    });

    it('should be created', () => {
        expect(effects).toBeTruthy();
    });
});
