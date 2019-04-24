import {TestBed, inject} from '@angular/core/testing';
import {provideMockActions} from '@ngrx/effects/testing';
import {Observable} from 'rxjs';

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
    });

    it('should be created', () => {
        expect(effects).toBeTruthy();
    });
});
