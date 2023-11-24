import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import {
    LoadChartStatistics,
    LoadDailyStatistics,
    LoadGlobalStatistics,
    LoadGlobalStatisticsDateRange,
    StatisticsActionTypes,
    UpdateChartStatistics,
    UpdateGlobalStatistics,
} from "../actions/statistics.actions";
import { StatisticsService } from "../../../core/services/statistics.service";
import { concatMap, concatMapTo, map, mergeMap } from "rxjs/operators";
import { defer } from "rxjs";
import { addUser } from "../../../core/actions/user.actions";
import { selectLoggedInUser } from "../../../core/selectors/user.selectors";
import { Store } from "@ngrx/store";
import { ChartStatistics, GlobalStatistics } from "@data/statistics";

@Injectable()
export class StatisticsEffects {
    loadGlobalStatistics$ = createEffect(() =>
        this.actions$.pipe(
            ofType<LoadGlobalStatistics>(StatisticsActionTypes.loadGlobalStatistics),
            mergeMap(() => this.statisticsService.loadGlobalStatistics()),
            map(
                (globalStatistics: GlobalStatistics) =>
                    new UpdateGlobalStatistics({
                        globalStatistics: globalStatistics,
                    }),
            ),
        ),
    );

    loadChartStatistics$ = createEffect(() =>
        this.actions$.pipe(
            ofType<LoadChartStatistics>(StatisticsActionTypes.loadChartStatistics),
            mergeMap(() => this.statisticsService.loadChartsData()),
            map(
                (chartStaticstics: ChartStatistics) =>
                    new UpdateChartStatistics({
                        chartStatistics: chartStaticstics,
                    }),
            ),
        ),
    );

    // loadDailyStatistics$ = createEffect(() =>
    //     this.actions$.pipe(
    //         ofType<LoadDailyStatistics>(
    //             StatisticsActionTypes.loadDailyStatistics
    //         ),
    //         mergeMap(() => this.statisticsService.loadDailyStatistics()),
    //         map(
    //             (dailyStatistics: DailyStatistics) =>
    //                 new UpdateDailyStatistics({ dailyStatistics })
    //         )
    //     )
    // );
    //
    // @Effect({dispatch: false})
    // LoadGlobalStatisticsDateRange = this.actions$
    //     .pipe(
    //         ofType<LoadGlobalStatisticsDateRange>(StatisticsActionTypes.LoadGlobalStatisticsDateRange),
    //     );

    loadAllStatistics = createEffect(() =>
        this.actions$.pipe(
            ofType(addUser),
            concatMapTo([
                new LoadChartStatistics(),
                new LoadDailyStatistics(),
                new LoadGlobalStatistics(),
                new LoadGlobalStatisticsDateRange(),
            ]),
        ),
    );

    init$ = createEffect(() =>
        defer(() =>
            this.store
                .select(selectLoggedInUser)
                .pipe(
                    concatMap(() => [
                        new LoadChartStatistics(),
                        new LoadDailyStatistics(),
                        new LoadGlobalStatistics(),
                        new LoadGlobalStatisticsDateRange(),
                    ]),
                ),
        ),
    );

    constructor(
        private actions$: Actions,
        private statisticsService: StatisticsService,
        private store: Store,
    ) {}
}
