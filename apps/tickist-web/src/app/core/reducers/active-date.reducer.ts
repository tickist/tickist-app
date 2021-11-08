import {updateActiveDate} from '../actions/active-date.actions';
import {stateActiveDateElement} from '@data/state-active-date-element.enum';
import {format} from 'date-fns';
import {Action, createReducer, on} from "@ngrx/store";


export interface ActiveDateState {
    active: {
        date: string;
        state: stateActiveDateElement
    };
}

export const activeDateInitialState: ActiveDateState = {
    active: {
        date: format(new Date(), 'dd-MM-yyyy'),
        state: stateActiveDateElement.weekdays
    }
};

const activeDateReducer = createReducer(
    activeDateInitialState,
    on(updateActiveDate, (state, props) => ({
            active: {
                date: props.date,
                state: props.state
            }
        }))
)

export function reducer(state: ActiveDateState, action: Action) {
    return activeDateReducer(state, action);
}
