import {TestBed} from '@angular/core/testing';
import {provideMockActions} from '@ngrx/effects/testing';
import {Observable, ReplaySubject} from 'rxjs';

import {NotificationsEffects} from './notifications.effects';

describe('NotificationsEffects', () => {
    let actions$: Observable<any>;
    let effects: NotificationsEffects;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                NotificationsEffects,
                provideMockActions(() => actions$)
            ]
        });

        effects = TestBed.inject<NotificationsEffects>(NotificationsEffects);
        actions$ = new ReplaySubject(1);
    });

    it('should be created', () => {
        expect(effects).toBeTruthy();
    });
});
