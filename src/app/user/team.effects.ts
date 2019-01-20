import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {UserService} from './user.service';
import {AddTeamMemers, LoadTeams, TeamActionTypes} from './team.actions';
import {map, mergeMap} from 'rxjs/operators';
import {SimpleUser} from './models';


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
