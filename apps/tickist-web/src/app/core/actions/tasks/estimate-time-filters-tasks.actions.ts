import { createAction, props } from "@ngrx/store";
import { Filter } from "@data/filter";

export const addEstimateTimeFiltersTasks = createAction(
    "[EstimateTimeFiltersTasks] Add estimate time filters tasks",
    props<{ filtersLt: Filter[]; filtersGt: Filter[] }>()
);

export const setCurrentEstimateTimeFiltersTasks = createAction(
    "[EstimateTimeFiltersTasks] Set current estimate time filters tasks",
    props<{ currentFilterLt: Filter; currentFilterGt: Filter }>()
);
