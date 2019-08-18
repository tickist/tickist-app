import {Router, ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {Injectable} from '@angular/core';
import {CanActivate} from '@angular/router';
import {UserService} from '../services/user.service';
import {AuthService} from '../services/auth.service';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';


@Injectable()
export class AnonymousGuard implements CanActivate {

    constructor(protected router: Router, private authService: AuthService) {
    }

    canActivate(route: ActivatedRouteSnapshot, stateRouter: RouterStateSnapshot): Observable<boolean> {

        return this.authService.authState$.pipe(map(state => {
                console.log(state)
                if (state === null) {
                    return true;
                }
                this.router.navigate(['home']);
                return false;
            }
            )
        );

        //
        //
        //
        // if (state.url !== '/home' && this.authService.isLoggedIn()) {
        //     this.router.navigate(['home']);
        //     return false;
        // }
        // return true;
    }
}
