import {TestBed, inject} from '@angular/core/testing';
import {provideMockActions} from '@ngrx/effects/testing';
import {Observable, ReplaySubject} from 'rxjs';

import {ActiveProjectsIdsEffects} from './active-projects-ids.effects';
import {StoreModule} from '@ngrx/store';

describe('ActiveProjectsIdsEffects', () => {
    let actions$: Observable<any>;
    let effects: ActiveProjectsIdsEffects;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [StoreModule.forRoot({})],
            providers: [
                ActiveProjectsIdsEffects,
                provideMockActions(() => actions$)
            ]
        });

        effects = TestBed.get(ActiveProjectsIdsEffects);
        actions$ = new ReplaySubject(1);
    });

    it('should be created', () => {
        expect(effects).toBeTruthy();
    });
});
