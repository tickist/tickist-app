import {TestBed, inject} from '@angular/core/testing';
import {provideMockActions} from '@ngrx/effects/testing';
import {Observable, ReplaySubject} from 'rxjs';

import {ActiveProjectEffects} from './active-project.effects';
import {StoreModule} from '@ngrx/store';

describe('ActiveProjecEffects', () => {
    let actions$: Observable<any>;
    let effects: ActiveProjectEffects;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [StoreModule.forRoot({})],
            providers: [
                ActiveProjectEffects,
                provideMockActions(() => actions$)
            ]
        });

        effects = TestBed.get(ActiveProjectEffects);
        actions$ = new ReplaySubject(1);
    });

    it('should be created', () => {
        expect(effects).toBeTruthy();
    });
});
