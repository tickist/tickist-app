import {addSortByOptions, setCurrentSortBy,} from '../../actions/tasks/sort-tasks.actions';
import {SortBy} from '@data/tasks/models/sortBy';
import {Action, createReducer, on} from "@ngrx/store";
import {resetStore} from "../../../tickist.actions";

export interface SortByState {
    sortByOptions: SortBy[];
    currentSortBy: SortBy;
}

export const initialState: SortByState = {
    sortByOptions: [],
    currentSortBy: undefined
};

const sortTasksReducer = createReducer(
    initialState,
    on(addSortByOptions, (state, props) => {
        return {sortByOptions: props.sortByOptions, currentSortBy: state.currentSortBy}
    }),
    on(setCurrentSortBy, (state, props) => {
        return {sortByOptions: state.sortByOptions, currentSortBy: props.currentSortBy}
    }),
    on(resetStore)
)

export function reducer(state: SortByState, action: Action) {
    return sortTasksReducer(state, action);
}

