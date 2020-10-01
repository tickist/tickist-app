import {
    addEstimateTimeFiltersTasks,
    setCurrentEstimateTimeFiltersTasks
} from '../../actions/tasks/estimate-time-filters-tasks.actions';
import {Filter} from '@data/filter';
import {Action, createReducer, on} from "@ngrx/store";


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

const estimateTimeFiltersReducer = createReducer(
    initialState,
    on(addEstimateTimeFiltersTasks, (state, props) => {
        return {
            filters_lt: props.filters_lt,
            filters_gt: props.filters_lt,
            currentFilter_lt: state.currentFilter_lt,
            currentFilter_gt: state.currentFilter_gt
        }
    }),
    on(setCurrentEstimateTimeFiltersTasks, (state, props) => {
        return {
            filters_lt: state.filters_lt,
            filters_gt: state.filters_lt,
            currentFilter_lt: props.currentFilter_lt,
            currentFilter_gt: props.currentFilter_gt
        }
    })
)

export function reducer(state: EstimateTimeFiltersState, action: Action) {
    return estimateTimeFiltersReducer(state, action);
}

