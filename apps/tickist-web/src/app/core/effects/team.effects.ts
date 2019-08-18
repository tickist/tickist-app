import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {UserService} from '../services/user.service';
import {AddTeamMemers, LoadTeams, TeamActionTypes} from '../actions/team.actions';
import {map, mergeMap} from 'rxjs/operators';
import {SimpleUser} from '../../../../../../libs/data/src/lib/users/models';


@Injectable()
export class TeamEffects {

    @Effect()
    loadTeam$ = this.actions$
        .pipe(
            ofType<LoadTeams>(TeamActionTypes.LoadTeams),
            mergeMap(() => this.userService.loadTeam()),
            map((users: SimpleUser[]) => new AddTeamMemers({users: users}))
        );

    constructor(private actions$: Actions, private userService: UserService) {
    }

}
