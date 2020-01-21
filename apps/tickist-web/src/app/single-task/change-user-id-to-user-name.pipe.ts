import {Pipe, PipeTransform} from '@angular/core';
import {Store} from '@ngrx/store';
import {selectTeam} from '../core/selectors/team.selectors';

@Pipe({
    name: 'changeUserIdToUserName',
    pure: true
})
export class ChangeUserIdToUserNamePipe implements PipeTransform {
    team: any;

    constructor(private store: Store<{}>) {
        this.store.select(selectTeam).pipe(

        ).subscribe(team => {
            this.team = team;
            console.log("aaa")
        });
    }

    transform(value: any, args?: any): any {
        return this.team.find(user => user.id === value).username;
    }

}
