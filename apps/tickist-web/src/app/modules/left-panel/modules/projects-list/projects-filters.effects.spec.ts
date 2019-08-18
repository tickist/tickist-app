import {TestBed, inject} from '@angular/core/testing';
import {provideMockActions} from '@ngrx/effects/testing';
import {Observable, ReplaySubject} from 'rxjs';

import {ProjectsFiltersEffects} from './projects-filters.effects';
import {StoreModule} from '@ngrx/store';

describe('ProjectsFiltersEffects', () => {
    let actions$: Observable<any>;
    let effects: ProjectsFiltersEffects;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [StoreModule.forRoot({})],
            providers: [
                ProjectsFiltersEffects,
                provideMockActions(() => actions$)
            ]
        });

        effects = TestBed.get(ProjectsFiltersEffects);
        actions$ = new ReplaySubject(1);
    });

    it('should be created', () => {
        expect(effects).toBeTruthy();
    });
});
