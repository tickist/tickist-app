import { UserState } from "../reducers/user.reducer";
import { createFeatureSelector, createSelector } from "@ngrx/store";

export const selectUserState = (state) => state.user;

export const selectLoggedInUser = createSelector(
    selectUserState,
    (userState) => userState.user
);
