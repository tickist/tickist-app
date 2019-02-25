import {GlobalStatistics} from '../../../models/statistics';
import {StatisticsActions, StatisticsActionTypes} from '../actions/statistics.actions';


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
