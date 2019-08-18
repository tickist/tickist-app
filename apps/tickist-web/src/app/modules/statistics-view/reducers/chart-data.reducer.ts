import {ChartStatistics} from '../../../../../../../libs/data/src/lib/statistics';
import {StatisticsActions, StatisticsActionTypes} from '../actions/statistics.actions';


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
