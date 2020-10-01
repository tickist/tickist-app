import {Action, createReducer, on} from "@ngrx/store";
import {updateLeftSidenavVisibility} from "./actions/configuration";

interface LeftSidenavVisibilityState {
    'position': string,
    'mode': string,
    'open': boolean
}

const initialState: LeftSidenavVisibilityState = {
    'position': 'start',
    'mode': 'side',
    'open': true
}

const leftSidenavVisibilityReducer = createReducer(
    initialState,
    on(updateLeftSidenavVisibility, (state, props)=> {
        return Object.assign({}, state, props);
    })
)

export function reducer(state: LeftSidenavVisibilityState, action: Action) {
    return leftSidenavVisibilityReducer(state, action);
}

