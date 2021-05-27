import {TestBed} from '@angular/core/testing';
import {provideMockActions} from '@ngrx/effects/testing';
import {Observable, ReplaySubject} from 'rxjs';

import {TaskEffects} from './task.effects';
import {StoreModule} from '@ngrx/store';
import {TaskService} from '../services/task.service';
import {AngularFireModule} from '@angular/fire';
import {AngularFireAuthModule} from '@angular/fire/auth';
import {AngularFirestoreModule} from '@angular/fire/firestore';
import {environment} from '../../../environments/environment.dev';
import {TickistMaterialModule} from '../../material.module';

class TaskServiceMock {}

describe('TaskEffects', () => {
    let actions$: Observable<any>;
    let effects: TaskEffects;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [StoreModule.forRoot({}),  AngularFireModule.initializeApp(environment.firebase),
                AngularFireAuthModule, AngularFirestoreModule, TickistMaterialModule],
            providers: [
                TaskEffects,
                { provide: TaskService, useClass: TaskServiceMock },
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
