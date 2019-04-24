import * as fromCourse from '../reducers/team.reducer';
import {createFeatureSelector, createSelector} from '@ngrx/store';
import {TeamState} from '../reducers/team.reducer';


export const selectTeamState = createFeatureSelector<TeamState>('team');

export const selectTeam = createSelector(
    selectTeamState,
    fromCourse.selectAll
);
