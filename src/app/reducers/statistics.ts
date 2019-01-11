import * as statisticsActions from './actions/statistics';


export function globalStatistics(state = null, action: statisticsActions.Actions) {
    switch (action.type) {
        case statisticsActions.UPDATE_GLOBAL_STATISTICS:
            return action.payload;
        default:
            return state;
    }
}


export function chartsData(state = null, action: statisticsActions.Actions) {
    switch (action.type) {
        case statisticsActions.UPDATE_CHARTS_DATA:
            return action.payload;
        default:
            return state;
    }
}


export function dailyStatistics(state = null, action: statisticsActions.Actions) {
    switch (action.type) {
        case statisticsActions.UPDATE_DAILY_STATISTICS:
            return action.payload;
        default:
            return state;
    }
}


export function globalStatisticsDateRange(state = null, action: statisticsActions.Actions) {
    switch (action.type) {
        case statisticsActions.UPDATE_GLOBAL_STATISTICS_DATE_RANGE:
            return action.payload;
        default:
            return state;
    }
}
