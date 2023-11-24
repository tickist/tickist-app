import { createFeatureSelector, createSelector } from "@ngrx/store";
import { ChartStatisticsState } from "./reducers/chart-data.reducer";
import { GlobalStatisticsDateRangeState } from "./reducers/global-statistics-date-range.reducer";
import { GlobalStatisticsState } from "./reducers/global-statistics.reducer";
import { DailyStatisticsState } from "./reducers/daily-statistics.reducer";

export const selectChartStatisticsState = createFeatureSelector<ChartStatisticsState>("chartStatistics");
export const selectDailyStatisticsState = createFeatureSelector<DailyStatisticsState>("dailyStatistics");
export const selectGlobalStatisticsState = createFeatureSelector<GlobalStatisticsState>("globalStatistics");
export const selectGlobalStatisticsDateRangeState = createFeatureSelector<GlobalStatisticsDateRangeState>("globalStatisticsDateRange");

export const selectChartStatistics = createSelector(selectChartStatisticsState, (chartStatistics) => chartStatistics.chartStatistics);

export const selectDailyStatistics = createSelector(selectDailyStatisticsState, (dailyStatistics) => dailyStatistics.dailyStatistics);

export const selectGlobalStatistics = createSelector(selectGlobalStatisticsState, (globalStatistics) => globalStatistics.globalStatistics);

export const selectGlobalStatisticsDateRangeS = createSelector(
    selectGlobalStatisticsDateRangeState,
    (globalStatisticsDateRange) => globalStatisticsDateRange.globalStatisticsDateRange,
);
