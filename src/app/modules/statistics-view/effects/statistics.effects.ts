import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {
    LoadChartStatistics,
    LoadDailyStatistics,
    LoadGlobalStatistics,
    LoadGlobalStatisticsDateRange,
    StatisticsActionTypes,
    UpdateChartStatistics,
    UpdateDailyStatistics,
    UpdateGlobalStatistics
} from '../actions/statistics.actions';
import {StatisticsService} from '../../../services/statistics.service';
import {concatMap, concatMapTo, map, mergeMap} from 'rxjs/operators';
import {ChartStatistics, DailyStatistics, GlobalStatistics} from '../../../models/statistics';
import {defer} from 'rxjs';
import {AddUser, UserActionTypes} from '../../../core/actions/user.actions';
import {selectLoggedInUser} from '../../../core/selectors/user.selectors';
import {Store} from '@ngrx/store';
import {AppStore} from '../../../store';


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

    @Effect()
    loadAllStatistics = this.actions$
        .pipe(
            ofType<AddUser>(UserActionTypes.AddUser),
            concatMapTo([
                new LoadChartStatistics(),
                new LoadDailyStatistics(),
                new LoadGlobalStatistics(),
                new LoadGlobalStatisticsDateRange()
            ])
        );

    @Effect()
    init$ = defer(() => {
        return this.store.select(selectLoggedInUser).pipe(
            concatMap(() => {
                return [
                    new LoadChartStatistics(),
                    new LoadDailyStatistics(),
                    new LoadGlobalStatistics(),
                    new LoadGlobalStatisticsDateRange()
                ];
            })
        );
    });


    constructor(private actions$: Actions, private statisticsService: StatisticsService, private store: Store<AppStore>) {
    }

}
