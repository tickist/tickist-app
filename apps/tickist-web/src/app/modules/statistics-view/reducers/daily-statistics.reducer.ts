import {DailyStatistics} from '../../../models/statistics';
import {StatisticsActions, StatisticsActionTypes} from '../actions/statistics.actions';


export interface DailyStatisticsState {
    dailyStatistics: DailyStatistics;
}

export const initialState: DailyStatisticsState = {
        dailyStatistics: undefined
    };

export function reducer(state = initialState, action: StatisticsActions): DailyStatisticsState {
    switch (action.type) {
        case StatisticsActionTypes.UpdateDailyStatistics:
            return {dailyStatistics: action.payload.dailyStatistics};
        default:
            return state;
    }
}
