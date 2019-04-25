import {TestBed, inject} from '@angular/core/testing';
import {provideMockActions} from '@ngrx/effects/testing';
import {Observable, ReplaySubject} from 'rxjs';

import {AssignedToFiltersTasksEffects} from './assigned-to-filters-tasks.effects';

describe('AssignedToFiltersTasksEffects', () => {
    let actions$: Observable<any>;
    let effects: AssignedToFiltersTasksEffects;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                AssignedToFiltersTasksEffects,
                provideMockActions(() => actions$)
            ]
        });

        effects = TestBed.get(AssignedToFiltersTasksEffects);
        actions$ = new ReplaySubject(1);
    });

    it('should be created', () => {
        expect(effects).toBeTruthy();
    });
});
