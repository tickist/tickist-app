import {Action} from '@ngrx/store';
import {IActiveDateElement} from '../../models/active-data-element.interface';
import {stateActiveDateElement} from '../../models/state-active-date-element.enum';


export enum ActiveDateActionTypes {
    UPDATE_ACTIVE_DATE = '[Core active date] Update active date',
}

export class UpdateActiveDate implements Action {
    readonly type = ActiveDateActionTypes.UPDATE_ACTIVE_DATE;

    constructor(public payload: {date: string, state: stateActiveDateElement}) {}
}



export type ActiveDateActions = UpdateActiveDate;