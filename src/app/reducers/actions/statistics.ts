import {Action} from "@ngrx/store";
import {ChartStatistics, DailyStatistics, GlobalStatistics} from "../../models/statistics";
export const UPDATE_GLOBAL_STATISTICS = 'UPDATE_GLOBAL_STATISTICS';
export const UPDATE_CHARTS_DATA = 'UPDATE_CHARTS_DATA';
export const UPDATE_DAILY_STATISTICS = 'UPDATE_DAILY_STATISTICS';
export const UPDATE_GLOBAL_STATISTICS_DATE_RANGE = 'UPDATE_GLOBAL_STATISTICS_DATE_RANGE';

export class UpdateGlobalStatistics implements Action {
  readonly type = UPDATE_GLOBAL_STATISTICS;

  constructor(public payload: GlobalStatistics) {
  }
}

export class UpdateChartsData implements Action {
  readonly type = UPDATE_CHARTS_DATA;

  constructor(public payload: ChartStatistics) {
  }
}

export class UpdateDailyStatistics implements Action {
  readonly type = UPDATE_DAILY_STATISTICS;

  constructor(public payload: DailyStatistics) {
  }
}

export class UpdateGlobalStatisticsDateRange implements Action {
  readonly type = UPDATE_GLOBAL_STATISTICS_DATE_RANGE;

  constructor(public payload: GlobalStatistics) {
  }
}

export type Actions = UpdateGlobalStatistics | UpdateChartsData | UpdateDailyStatistics | UpdateGlobalStatisticsDateRange
