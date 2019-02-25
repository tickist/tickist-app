import {SortTasksActions, SortTasksActionTypes} from '../actions/sort-tasks.actions';
import {SortBy} from '../../tasks/models/sortBy';
import {TickistActions, TickistActionTypes} from '../../tickist.actions';


export interface SortByState {
    sortByOptions: SortBy[];
    currentSortBy: SortBy;
}

export const initialState: SortByState = {
    sortByOptions: [],
    currentSortBy: undefined
};

export function reducer(state = initialState, action: SortTasksActions| TickistActions): SortByState {
    switch (action.type) {
        case SortTasksActionTypes.AddSortByOptions:
            return {sortByOptions: action.payload.sortByOptions, currentSortBy: state.currentSortBy};
        case SortTasksActionTypes.SetCurrentSortBy:
            return {sortByOptions: state.sortByOptions, currentSortBy: action.payload.currentSortBy};
        case TickistActionTypes.ResetStore:
            return initialState;
        default:
            return state;
    }
}
