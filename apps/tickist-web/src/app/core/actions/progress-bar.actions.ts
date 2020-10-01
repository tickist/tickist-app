import {Action, createAction} from '@ngrx/store';


export const switchOffProgressBar = createAction(
    '[Core progress bar] Switch off progress bar'
)
export const switchOnProgressBar = createAction(
    '[Core progress bar] Switch on progress bar'
)
