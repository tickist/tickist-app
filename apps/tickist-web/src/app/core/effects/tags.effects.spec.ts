import {TestBed} from '@angular/core/testing';
import {provideMockActions} from '@ngrx/effects/testing';
import {Observable, ReplaySubject} from 'rxjs';

import {TagsEffects} from './tags.effects';
import {StoreModule} from '@ngrx/store';
import {TagService} from '../services/tag.service';
import {HttpClientModule} from '@angular/common/http';
import {AngularFireModule} from '@angular/fire';
import {AngularFireAuthModule} from '@angular/fire/auth';
import {AngularFirestoreModule} from '@angular/fire/firestore';
import {environment} from '@env/environment.dev';

describe('TagsEffects', () => {
    let actions$: Observable<any>;
    let effects: TagsEffects;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                StoreModule.forRoot({}),
                HttpClientModule, AngularFireModule.initializeApp(environment.firebase),
                AngularFireAuthModule, AngularFirestoreModule
            ],
            providers: [
                TagsEffects,
                TagService,
                provideMockActions(() => actions$)
            ]
        });

        effects = TestBed.get(TagsEffects);
        actions$ = new ReplaySubject(1);
    });

    it('should be created', () => {
        expect(effects).toBeTruthy();
    });
});
