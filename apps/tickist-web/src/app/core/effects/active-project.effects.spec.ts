import {TestBed} from '@angular/core/testing';
import {provideMockActions} from '@ngrx/effects/testing';
import {Observable, ReplaySubject} from 'rxjs';

import {ActiveProjectEffects} from './active-project.effects';
import {StoreModule} from '@ngrx/store';
import {AngularFireAuthModule} from '@angular/fire/auth';
import {AngularFireModule} from '@angular/fire';
import {environment} from '@env/environment.dev';

describe('ActiveProjecEffects', () => {
    let actions$: Observable<any>;
    let effects: ActiveProjectEffects;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [StoreModule.forRoot({}), AngularFireModule.initializeApp(environment.firebase),
                AngularFireAuthModule],
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
