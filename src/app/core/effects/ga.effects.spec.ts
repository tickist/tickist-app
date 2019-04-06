import {TestBed, inject} from '@angular/core/testing';
import {provideMockActions} from '@ngrx/effects/testing';
import {Observable} from 'rxjs';

import {GaEffects} from './ga.effects';

describe('GaEffectsEffects', () => {
    let actions$: Observable<any>;
    let effects: GaEffects;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                GaEffects,
                provideMockActions(() => actions$)
            ]
        });

        effects = TestBed.get(GaEffects);
    });

    it('should be created', () => {
        expect(effects).toBeTruthy();
    });
});
