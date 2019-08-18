import {StatisticsActions, StatisticsActionTypes} from '../actions/statistics.actions';
import {ChartStatistics} from '@data/statistics';


export interface ChartStatisticsState {
    chartStatistics: ChartStatistics;
}

export const initialState: ChartStatisticsState = {
    chartStatistics: undefined
};

export function reducer(state = initialState, action: StatisticsActions): ChartStatisticsState {
    switch (action.type) {
        case StatisticsActionTypes.UpdateChartStatistics:
            return {chartStatistics: action.payload.chartStatistics};
        default:
            return state;
    }
}
