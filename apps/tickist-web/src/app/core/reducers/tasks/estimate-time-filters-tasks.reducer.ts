import {
    addEstimateTimeFiltersTasks,
    setCurrentEstimateTimeFiltersTasks,
} from "../../actions/tasks/estimate-time-filters-tasks.actions";
import { Filter } from "@data/filter";
import { Action, createReducer, on } from "@ngrx/store";

export interface EstimateTimeFiltersState {
    filtersLt: Filter[];
    filtersGt: Filter[];
    currentFilterLt: Filter;
    currentFilterGt: Filter;
}

export const initialState: EstimateTimeFiltersState = {
    filtersLt: [],
    filtersGt: [],
    currentFilterLt: undefined,
    currentFilterGt: undefined,
};

const estimateTimeFiltersReducer = createReducer(
    initialState,
    on(addEstimateTimeFiltersTasks, (state, props) => ({
        filtersLt: props.filtersLt,
        filtersGt: props.filtersLt,
        currentFilterLt: state.currentFilterLt,
        currentFilterGt: state.currentFilterGt,
    })),
    on(setCurrentEstimateTimeFiltersTasks, (state, props) => ({
        filtersLt: state.filtersLt,
        filtersGt: state.filtersLt,
        currentFilterLt: props.currentFilterLt,
        currentFilterGt: props.currentFilterGt,
    }))
);

export function reducer(state: EstimateTimeFiltersState, action: Action) {
    return estimateTimeFiltersReducer(state, action);
}
