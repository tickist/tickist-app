import {Router, ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {Injectable} from '@angular/core';
import {CanActivate} from '@angular/router';
import {UserService} from '../../user/user.service';
import {AuthService} from '../../auth/auth.service';


@Injectable()
export class AnonymousGuard implements CanActivate {

    constructor(protected router: Router, private authService: AuthService) {
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        if (state.url !== '/home' && this.authService.isLoggedIn()) {
            this.router.navigate(['home']);
            return false;
        }
        return true;
    }
}
