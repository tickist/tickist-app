import {EstimateTimeFiltersTasksActions, EstimateTimeFiltersTasksActionTypes} from '../../actions/tasks/estimate-time-filters-tasks.actions';
import {Filter} from '@data/filter';


export interface EstimateTimeFiltersState {
    filters_lt: Filter[];
    filters_gt: Filter[];
    currentFilter_lt: Filter;
    currentFilter_gt: Filter;
}

export const initialState: EstimateTimeFiltersState = {
    filters_lt: [],
    filters_gt: [],
    currentFilter_lt: undefined,
    currentFilter_gt: undefined
};

export function reducer(state = initialState, action: EstimateTimeFiltersTasksActions): EstimateTimeFiltersState {
    switch (action.type) {
        case EstimateTimeFiltersTasksActionTypes.AddEstimateTimeFiltersTasks:
            return {
                filters_lt: action.payload.filters_lt,
                filters_gt: action.payload.filters_lt,
                currentFilter_lt: state.currentFilter_lt,
                currentFilter_gt: state.currentFilter_gt
            };
        case EstimateTimeFiltersTasksActionTypes.SetCurrentEstimateTimeFiltersTasks:
            return {
                filters_lt: state.filters_lt,
                filters_gt: state.filters_lt,
                currentFilter_lt: action.payload.currentFilter_lt,
                currentFilter_gt: action.payload.currentFilter_gt
            };
        default:
            return state;
    }
}
