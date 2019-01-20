import {createFeatureSelector, createSelector} from '@ngrx/store';
import {TasksState} from '../tasks/task.reducer';
import {ChartStatisticsState} from './chart-data.reducer';
import {selectTasksState} from '../tasks/task.selectors';
import {GlobalStatisticsDateRangeState} from './global-statistics-date-range.reducer';
import {GlobalStatisticsState} from './global-statistics.reducer';
import {DailyStatisticsState} from './daily-statistics.reducer';
export const selectChartStatisticsState = createFeatureSelector<ChartStatisticsState>('chartStatistics');
export const selectDailyStatisticsState = createFeatureSelector<DailyStatisticsState>('dailyStatistics');
export const selectGlobalStatisticsState = createFeatureSelector<GlobalStatisticsState>('globalStatistics');
export const selectGlobalStatisticsDateRangeState = createFeatureSelector<GlobalStatisticsDateRangeState>('globalStatisticsDateRange');

export const selectChartStatistics = createSelector(
    selectChartStatisticsState,
    chartStatistics => chartStatistics.chartStatistics
);

export const selectDailyStatistics = createSelector(
    selectDailyStatisticsState,
    dailyStatistics => dailyStatistics.dailyStatistics
);

export const selectGlobalStatistics = createSelector(
    selectGlobalStatisticsState,
    globalStatistics => globalStatistics.globalStatistics
);

export const selectGlobalStatisticsDateRangeS = createSelector(
    selectGlobalStatisticsDateRangeState,
    globalStatisticsDateRange => globalStatisticsDateRange.globalStatisticsDateRange
);
