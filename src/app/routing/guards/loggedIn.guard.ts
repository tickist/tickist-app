import {Router, ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';

import {Injectable} from '@angular/core';
import {CanActivate} from '@angular/router';
import {AuthService} from '../../auth/auth.service';


@Injectable()
export class LoggedInGuard implements CanActivate {

    constructor(protected router: Router, private authService: AuthService) {

    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        if (state.url !== '/login' && !this.authService.isLoggedIn()) {
            this.router.navigate(['login']);
            return false;
        }
        return true;
    }
}
