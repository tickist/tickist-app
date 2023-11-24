import { createAction, props } from "@ngrx/store";
import { StateActiveDateElement } from "@data/state-active-date-element.enum";

export const updateActiveDate = createAction(
    "[Core active date] Update active date",
    props<{ date: string; state: StateActiveDateElement }>(),
);
