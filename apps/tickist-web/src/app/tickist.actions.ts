import {Action} from '@ngrx/store';


export enum TickistActionTypes {
    ResetStore = '[Tickist] Clear All data from store',

}

export class ResetStore implements Action {

    readonly type = TickistActionTypes.ResetStore;

}


export type TickistActions = ResetStore;
