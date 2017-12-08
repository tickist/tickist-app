import {Router, ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';

import {Injectable} from "@angular/core";
import {CanActivate} from "@angular/router";
import {UserService} from "../services/userService"


@Injectable()
export class LoggedInGuard implements CanActivate {

  constructor(protected router: Router, private userService: UserService) {

  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (state.url !== '/login' && !this.userService.isLoggedIn()) {
      this.router.navigate(['login']);
      return false;
    }
    return true;
  }
}
