import {TestBed, inject} from '@angular/core/testing';
import {provideMockActions} from '@ngrx/effects/testing';
import {Observable} from 'rxjs';

import {UserEffects} from './user.effects';
import {StoreModule} from '@ngrx/store';

describe('UserEffects', () => {
    let actions$: Observable<any>;
    let effects: UserEffects;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [StoreModule.forRoot({})],
            providers: [
                UserEffects,
                provideMockActions(() => actions$)
            ]
        });

        effects = TestBed.get(UserEffects);
    });

    it('should be created', () => {
        expect(effects).toBeTruthy();
    });
});
