import {TestBed, inject} from '@angular/core/testing';
import {provideMockActions} from '@ngrx/effects/testing';
import {Observable, ReplaySubject} from 'rxjs';

import {TaskEffects} from './task.effects';
import {StoreModule} from '@ngrx/store';

describe('TaskEffects', () => {
    let actions$: Observable<any>;
    let effects: TaskEffects;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [StoreModule.forRoot({})],
            providers: [
                TaskEffects,
                provideMockActions(() => actions$)
            ]
        });

        effects = TestBed.get(TaskEffects);
        actions$ = new ReplaySubject(1);
    });

    it('should be created', () => {
        expect(effects).toBeTruthy();
    });
});
