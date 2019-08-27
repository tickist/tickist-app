import {Action} from '@ngrx/store';
import {ChartStatistics, DailyStatistics, GlobalStatistics} from '@data/statistics';


export enum StatisticsActionTypes {
    LoadGlobalStatistics = '[Statistics] Load Global Statistics',
    LoadChartStatistics = '[Statistics] Load AChart Statistics',
    LoadDailyStatistics = '[Statistics] Load Daily Statistics',
    LoadGlobalStatisticsDateRange = '[Statistics] Load Global statistics days range',
    UpdateGlobalStatistics = '[Statistics] Update global statistics',
    UpdateChartStatistics = '[Statistics Update chart statistics',
    UpdateDailyStatistics = '[Statistics Update daily statistics',
    UpdateGlobalStatisticsDateRange = '[Statistics Update global statistics date range',


}

export class LoadGlobalStatistics implements Action {
    readonly type = StatisticsActionTypes.LoadGlobalStatistics;
}

export class LoadChartStatistics implements Action {
    readonly type = StatisticsActionTypes.LoadChartStatistics;
}

export class LoadDailyStatistics implements Action {
    readonly type = StatisticsActionTypes.LoadDailyStatistics;
}

export class LoadGlobalStatisticsDateRange implements Action {
    readonly type = StatisticsActionTypes.LoadGlobalStatisticsDateRange;
}

export class UpdateGlobalStatistics implements Action {
    readonly type = StatisticsActionTypes.UpdateGlobalStatistics;

    constructor(public payload: { globalStatistics: GlobalStatistics }) {
    }
}

export class UpdateChartStatistics implements Action {
    readonly type = StatisticsActionTypes.UpdateChartStatistics;

    constructor(public payload: { chartStatistics: ChartStatistics }) {
    }
}

export class UpdateDailyStatistics implements Action {
    readonly type = StatisticsActionTypes.UpdateDailyStatistics;

    constructor(public payload: { dailyStatistics: DailyStatistics }) {
    }
}

export class UpdateGlobalStatisticsDateRange implements Action {
    readonly type = StatisticsActionTypes.UpdateGlobalStatisticsDateRange;

    constructor(public payload: { globalStatisticsDateRange: GlobalStatistics }) {
    }
}


export type StatisticsActions = UpdateChartStatistics
    | UpdateGlobalStatistics
    | UpdateDailyStatistics
    | UpdateGlobalStatisticsDateRange
    | LoadGlobalStatistics
    | LoadChartStatistics
    | LoadGlobalStatisticsDateRange
    | LoadDailyStatistics;
