import {TestBed, inject} from '@angular/core/testing';
import {provideMockActions} from '@ngrx/effects/testing';
import {Observable} from 'rxjs';
import {StatisticsEffects} from './statistics.effects';
import {StoreModule} from '@ngrx/store';


describe('Statistics.EffectEffects', () => {
    let actions$: Observable<any>;
    let effects: StatisticsEffects;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [StoreModule.forRoot({})],
            providers: [
                StatisticsEffects,
                provideMockActions(() => actions$)
            ]
        });

        effects = TestBed.get(StatisticsEffects);
    });

    it('should be created', () => {
        expect(effects).toBeTruthy();
    });
});
