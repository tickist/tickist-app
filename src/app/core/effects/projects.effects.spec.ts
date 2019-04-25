import {TestBed, inject} from '@angular/core/testing';
import {provideMockActions} from '@ngrx/effects/testing';
import {Observable, ReplaySubject} from 'rxjs';

import {ProjectsEffects} from './projects.effects';
import {StoreModule} from '@ngrx/store';

describe('ProjectsEffects', () => {
    let actions$: Observable<any>;
    let effects: ProjectsEffects;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [StoreModule.forRoot({})],
            providers: [
                ProjectsEffects,
                provideMockActions(() => actions$)
            ]
        });

        effects = TestBed.get(ProjectsEffects);
        actions$ = new ReplaySubject(1);
    });

    it('should be created', () => {
        expect(effects).toBeTruthy();
    });
});
