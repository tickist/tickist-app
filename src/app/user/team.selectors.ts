import * as fromCourse from './team.reducer';
import {createFeatureSelector, createSelector} from '@ngrx/store';
import {TeamState} from './team.reducer';


export const selectTeamState = createFeatureSelector<TeamState>('team');

export const selectTeam = createSelector(
    selectTeamState,
    fromCourse.selectAll
);
