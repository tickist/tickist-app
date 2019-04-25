import {TestBed, inject} from '@angular/core/testing';
import {provideMockActions} from '@ngrx/effects/testing';
import {Observable, ReplaySubject} from 'rxjs';

import {TeamEffects} from './team.effects';
import {StoreModule} from '@ngrx/store';

describe('TeamEffects', () => {
    let actions$: Observable<any>;
    let effects: TeamEffects;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [StoreModule.forRoot({})],
            providers: [
                TeamEffects,
                provideMockActions(() => actions$)
            ]
        });

        effects = TestBed.get(TeamEffects);
        actions$ = new ReplaySubject(1);
    });

    it('should be created', () => {
        expect(effects).toBeTruthy();
    });
});
