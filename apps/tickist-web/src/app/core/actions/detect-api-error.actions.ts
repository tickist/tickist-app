import { createAction } from "@ngrx/store";

export const showApiErrorBar = createAction("[Core api error] Show api error bar");

export const hideApiErrorBar = createAction("[Core api error] Hide api error bar");
