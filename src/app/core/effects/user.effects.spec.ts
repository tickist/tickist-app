import {TestBed, inject} from '@angular/core/testing';
import {provideMockActions} from '@ngrx/effects/testing';
import {Observable, ReplaySubject} from 'rxjs';

import {UserEffects} from './user.effects';
import {StoreModule} from '@ngrx/store';
import {UserService} from '../services/user.service';

class UserServiceMock {

}

describe('UserEffects', () => {
    let actions$: Observable<any>;
    let effects: UserEffects;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [StoreModule.forRoot({})],
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
