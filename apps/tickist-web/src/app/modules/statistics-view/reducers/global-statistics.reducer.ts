import {StatisticsActions, StatisticsActionTypes} from '../actions/statistics.actions';
import {GlobalStatistics} from '@data/statistics';


export interface GlobalStatisticsState {
    globalStatistics: GlobalStatistics;
}

export const initialState: GlobalStatisticsState = {
    globalStatistics: undefined
};

export function reducer(state = initialState, action: StatisticsActions): GlobalStatisticsState {
    switch (action.type) {
        case StatisticsActionTypes.UpdateGlobalStatistics:
            return {globalStatistics: action.payload.globalStatistics};
        default:
            return state;
    }
}
