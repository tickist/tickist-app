import {ActiveDateActions, ActiveDateActionTypes} from '../actions/active-date.actions';
import {stateActiveDateElement} from '@data/state-active-date-element.enum';
import {format} from 'date-fns';


export interface ActiveDateState {
    active: {
        date: string;
        state: stateActiveDateElement
    };
}

export const activeDateInitialState: ActiveDateState = {
    active: {
        date: format(new Date(), 'DD-MM-YYYY'),
        state: stateActiveDateElement.weekdays
    }
};


export function reducer(state: ActiveDateState = activeDateInitialState, action: ActiveDateActions) {
    switch (action.type) {
        case ActiveDateActionTypes.UPDATE_ACTIVE_DATE:
            return {active: action.payload};
        default:
            return state;
    }
}
