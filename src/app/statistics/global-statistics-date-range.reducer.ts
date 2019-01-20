import {StatisticsActions, StatisticsActionTypes} from './statistics.actions';


export interface GlobalStatisticsDateRangeState {
    globalStatisticsDateRange: any;
}

export const initialState: GlobalStatisticsDateRangeState = {
    globalStatisticsDateRange: undefined
};

export function reducer(state = initialState, action: StatisticsActions): GlobalStatisticsDateRangeState {
    switch (action.type) {
        case StatisticsActionTypes.UpdateGlobalStatisticsDateRange:
            return {globalStatisticsDateRange: action.payload.globalStatisticsDateRange};
        default:
            return state;
    }
}
