import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {
    LoadChartStatistics,
    LoadDailyStatistics,
    LoadGlobalStatistics,
    StatisticsActionTypes, UpdateChartStatistics, UpdateDailyStatistics, UpdateGlobalStatistics
} from './statistics.actions';
import {StatisticsService} from '../services/statistics.service';
import {map, mergeMap} from 'rxjs/operators';
import {ChartStatistics, DailyStatistics, GlobalStatistics} from '../models/statistics';


@Injectable()
export class StatisticsEffects {

    @Effect()
    LoadGlobalStatistics$ = this.actions$
        .pipe(
            ofType<LoadGlobalStatistics>(StatisticsActionTypes.LoadGlobalStatistics),
            mergeMap(() => this.statisticsService.loadGlobalStatistics()),
            map((globalStatistics: GlobalStatistics) => new UpdateGlobalStatistics({globalStatistics: globalStatistics}))
        );

    @Effect()
    LoadChartStatistics$ = this.actions$
        .pipe(
            ofType<LoadChartStatistics>(StatisticsActionTypes.LoadChartStatistics),
            mergeMap(() => this.statisticsService.loadChartsData()),
            map((chartStaticstics: ChartStatistics) => new UpdateChartStatistics(({chartStatistics: chartStaticstics})))
        );

    @Effect()
    LoadDailyStatistics$ = this.actions$
        .pipe(
            ofType<LoadDailyStatistics>(StatisticsActionTypes.LoadDailyStatistics),
            mergeMap(() => this.statisticsService.loadDailyStatistics()),
            map((dailyStatistics: DailyStatistics) => new UpdateDailyStatistics({dailyStatistics}))
        );
    //
    // @Effect({dispatch: false})
    // LoadGlobalStatisticsDateRange = this.actions$
    //     .pipe(
    //         ofType<LoadGlobalStatisticsDateRange>(StatisticsActionTypes.LoadGlobalStatisticsDateRange),
    //     );


    constructor(private actions$: Actions, private statisticsService: StatisticsService) {
    }

}
