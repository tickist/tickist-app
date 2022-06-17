import {clearSearchTasksFilter, setCurrentSearchTasksFilter} from '../../actions/tasks/search-tasks.actions';
import {Action, createReducer, on} from "@ngrx/store";

export interface SearchTaskState {
    searchText: string;
}

export const initialState: SearchTaskState = {
    searchText: ''
};

const searchTasksReducer = createReducer(
    initialState,
    on(setCurrentSearchTasksFilter, (state, props) => ({
            searchText: props.searchText
        })),
    on(clearSearchTasksFilter, (state, props) => ({
            searchText: ''
        }))
)

export function reducer(state: SearchTaskState, action: Action) {
    return searchTasksReducer(state, action);
}


