import * as userActions from './actions/user';

export function user(state: any = null, action: userActions.Actions) {
    switch (action.type) {
        case userActions.ADD_USER:
            return action.payload;
        case userActions.UPDATE_USER:
            return action.payload;
        default:
            return state;
    }
}
