import {setCurrrentSearchTasksFilter} from '../../actions/tasks/search-tasks.actions';
import {Action, createReducer, on} from "@ngrx/store";

export interface SearchTaskState {
    searchText: string;
}

export const initialState: SearchTaskState = {
    searchText: ''
};

const searchTasksReducer = createReducer(
    initialState,
    on(setCurrrentSearchTasksFilter, (state, props) => {
        return {
            searchText: props.searchText
        };
    })
)

export function reducer(state: SearchTaskState, action: Action) {
    return searchTasksReducer(state, action);
}


