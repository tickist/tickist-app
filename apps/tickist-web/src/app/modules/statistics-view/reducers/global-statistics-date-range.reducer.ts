import {
    StatisticsActions,
    StatisticsActionTypes,
} from "../actions/statistics.actions";

export interface GlobalStatisticsDateRangeState {
    globalStatisticsDateRange: any;
}

export const initialState: GlobalStatisticsDateRangeState = {
    globalStatisticsDateRange: undefined,
};

export function reducer(
    state = initialState,
    action: StatisticsActions
): GlobalStatisticsDateRangeState {
    switch (action.type) {
        case StatisticsActionTypes.updateGlobalStatisticsDateRange:
            return {
                globalStatisticsDateRange:
                    action.payload.globalStatisticsDateRange,
            };
        default:
            return state;
    }
}
