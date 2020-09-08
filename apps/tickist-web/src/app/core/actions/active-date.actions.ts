import {Action, createAction, props} from '@ngrx/store';
import {stateActiveDateElement} from '@data/state-active-date-element.enum';

export const updateActiveDate = createAction(
    '[Core active date] Update active date',
    props<{date: string, state: stateActiveDateElement}>()
)


