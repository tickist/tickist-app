import {TestBed, inject} from '@angular/core/testing';
import {provideMockActions} from '@ngrx/effects/testing';
import {Observable, ReplaySubject} from 'rxjs';

import {TasksFiltersEffects} from './tasks-filters.effects';
import {StoreModule} from '@ngrx/store';

describe('TasksFiltersEffects', () => {
    let actions$: Observable<any>;
    let effects: TasksFiltersEffects;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [StoreModule.forRoot({})],
            providers: [
                TasksFiltersEffects,
                provideMockActions(() => actions$)
            ]
        });

        effects = TestBed.get(TasksFiltersEffects);
        actions$ = new ReplaySubject(1);
    });

    it('should be created', () => {
        expect(effects).toBeTruthy();
    });
});
