import { createAction, props } from "@ngrx/store";
import { Filter } from "@data/filter";

export const addTagsFilters = createAction("[Tags Filters] Add tags filters", props<{ filters: Filter[] }>());

export const setCurrentTagsListFilter = createAction("[Tags Filters] Set current tags list filter", props<{ currentFilter: Filter }>());
