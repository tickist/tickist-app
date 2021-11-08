import { Action } from "@ngrx/store";
import {
    ChartStatistics,
    DailyStatistics,
    GlobalStatistics,
} from "@data/statistics";

// eslint-disable-next-line no-shadow
export enum StatisticsActionTypes {
    loadGlobalStatistics = "[Statistics] Load Global Statistics",
    loadChartStatistics = "[Statistics] Load AChart Statistics",
    loadDailyStatistics = "[Statistics] Load Daily Statistics",
    loadGlobalStatisticsDateRange = "[Statistics] Load Global statistics days range",
    updateGlobalStatistics = "[Statistics] Update global statistics",
    updateChartStatistics = "[Statistics Update chart statistics",
    updateDailyStatistics = "[Statistics Update daily statistics",
    updateGlobalStatisticsDateRange = "[Statistics Update global statistics date range",
}

export class LoadGlobalStatistics implements Action {
    readonly type = StatisticsActionTypes.loadGlobalStatistics;
}

export class LoadChartStatistics implements Action {
    readonly type = StatisticsActionTypes.loadChartStatistics;
}

export class LoadDailyStatistics implements Action {
    readonly type = StatisticsActionTypes.loadDailyStatistics;
}

export class LoadGlobalStatisticsDateRange implements Action {
    readonly type = StatisticsActionTypes.loadGlobalStatisticsDateRange;
}

export class UpdateGlobalStatistics implements Action {
    readonly type = StatisticsActionTypes.updateGlobalStatistics;

    constructor(public payload: { globalStatistics: GlobalStatistics }) {}
}

export class UpdateChartStatistics implements Action {
    readonly type = StatisticsActionTypes.updateChartStatistics;

    constructor(public payload: { chartStatistics: ChartStatistics }) {}
}

export class UpdateDailyStatistics implements Action {
    readonly type = StatisticsActionTypes.updateDailyStatistics;

    constructor(public payload: { dailyStatistics: DailyStatistics }) {}
}

export class UpdateGlobalStatisticsDateRange implements Action {
    readonly type = StatisticsActionTypes.updateGlobalStatisticsDateRange;

    constructor(
        public payload: { globalStatisticsDateRange: GlobalStatistics }
    ) {}
}

export type StatisticsActions =
    | UpdateChartStatistics
    | UpdateGlobalStatistics
    | UpdateDailyStatistics
    | UpdateGlobalStatisticsDateRange
    | LoadGlobalStatistics
    | LoadChartStatistics
    | LoadGlobalStatisticsDateRange
    | LoadDailyStatistics;
