import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {Task} from '../../models/tasks';
import {UserService} from '../../services/userService';
import {Observable} from 'rxjs';

@Injectable()
export class TeamResolver implements Resolve<Task> {
    constructor(private userService: UserService) {
    }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
        return this.userService.loadTeam();
    }
}
