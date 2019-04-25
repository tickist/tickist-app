import {TestBed, inject} from '@angular/core/testing';
import {provideMockActions} from '@ngrx/effects/testing';
import {Observable, ReplaySubject} from 'rxjs';

import {FutureTasksEffects} from './future-tasks.effects';

describe('FutureTasksEffects', () => {
    let actions$: Observable<any>;
    let effects: FutureTasksEffects;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                FutureTasksEffects,
                provideMockActions(() => actions$)
            ]
        });

        effects = TestBed.get(FutureTasksEffects);
        actions$ = new ReplaySubject(1);
    });

    it('should be created', () => {
        expect(effects).toBeTruthy();
    });
});
