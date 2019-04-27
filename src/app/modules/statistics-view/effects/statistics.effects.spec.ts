import {TestBed, inject} from '@angular/core/testing';
import {provideMockActions} from '@ngrx/effects/testing';
import {Observable, ReplaySubject} from 'rxjs';
import {StatisticsEffects} from './statistics.effects';
import {StoreModule} from '@ngrx/store';
import {UserService} from '../../../core/services/user.service';
import {StatisticsService} from '../../../services/statistics.service';

class StatisticsServiceMock {}

describe('Statistics.Effect', () => {
    let actions$: Observable<any>;
    let effects: StatisticsEffects;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [StoreModule.forRoot({})],
            providers: [
                StatisticsEffects,
                { provide: StatisticsService, useClass: StatisticsServiceMock },
                provideMockActions(() => actions$)
            ]
        });

        effects = TestBed.get(StatisticsEffects);
        actions$ = new ReplaySubject(1);
    });

    it('should be created', () => {
        expect(effects).toBeTruthy();
    });
});
