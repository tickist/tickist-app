import {OfflineModeActions, OfflineModeActionTypes} from '../actions/offline-mode.actions';

export interface OfflineModeBarState {
    offlineModeBar: {
        isEnabled: boolean
    };
}

export const offlineModeBarInitialState: OfflineModeBarState = {
    offlineModeBar: {
        isEnabled: false
    }
};


export function reducer(state: OfflineModeBarState = offlineModeBarInitialState, action: OfflineModeActions) {
    switch (action.type) {
        case OfflineModeActionTypes.SHOW_OFFLINE_MODE_BAR:
            return {offlineModeBar: {isEnabled: false}};
        case OfflineModeActionTypes.HIDE_OFFLINE_MODE_BAR:
            return {offlineModeBar: {isEnabled: true}};
        default:
            return state;
    }
}
