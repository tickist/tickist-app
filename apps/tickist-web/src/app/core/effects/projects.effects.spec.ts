import {TestBed} from '@angular/core/testing';
import {provideMockActions} from '@ngrx/effects/testing';
import {Observable, ReplaySubject} from 'rxjs';

import {ProjectsEffects} from './projects.effects';
import {StoreModule} from '@ngrx/store';
import {ProjectService} from '../services/project.service';
import {AngularFireModule} from '@angular/fire';
import {AngularFireAuthModule} from '@angular/fire/auth';
import {AngularFirestoreModule} from '@angular/fire/firestore';
import {environment} from '../../../environments/environment.dev';
import {TickistMaterialModule} from '../../material.module';

class ProjectServiceMock {}

describe('ProjectsEffects', () => {
    let actions$: Observable<any>;
    let effects: ProjectsEffects;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [StoreModule.forRoot({}), AngularFireModule.initializeApp(environment.firebase),
                AngularFireAuthModule, AngularFirestoreModule, TickistMaterialModule],
            providers: [
                ProjectsEffects,
                { provide: ProjectService, useClass: ProjectServiceMock },
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
