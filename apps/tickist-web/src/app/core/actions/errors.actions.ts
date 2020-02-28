import {createAction, props} from '@ngrx/store';


export const firebaseError = createAction(
    '[Error] Firebase error',
    props<{error: Error}>()
);
