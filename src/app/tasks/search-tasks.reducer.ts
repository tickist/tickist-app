import {SearchTasksActions, SearchTasksActionTypes} from '../core/actions/search-tasks.actions';


export interface SearchTaskState {
    searchText: string;
}

export const initialState: SearchTaskState = {
    searchText: ''
};

export function reducer(state = initialState, action: SearchTasksActions): SearchTaskState {
    switch (action.type) {
        case SearchTasksActionTypes.SetCurrrentSearchTasksFilter:
            return {searchText: action.payload.searchText};
        default:
            return state;
    }
}
