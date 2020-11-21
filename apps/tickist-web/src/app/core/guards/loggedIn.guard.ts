import {Router, ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';

import {Injectable} from '@angular/core';
import {CanActivate} from '@angular/router';
import {AuthService} from '../../modules/auth/services/auth.service';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';


@Injectable()
export class LoggedInGuard implements CanActivate {

    constructor(protected router: Router, private authService: AuthService) {

    }

    canActivate(route: ActivatedRouteSnapshot, stateRouter: RouterStateSnapshot): Observable<boolean> {
        return this.authService.authState$.pipe(map(state => {
                if (state !== null) {
                    return true;
                }
                this.router.navigate(['login']);
                return false;
            })
        );
    }
}
