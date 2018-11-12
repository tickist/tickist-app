import {Router, ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';

import {Injectable} from "@angular/core";
import {CanActivate} from "@angular/router";
import {UserService} from "../../services/userService"


@Injectable()
export class AnonymousGuard implements CanActivate {

  constructor(protected router: Router, private userService: UserService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (state.url !== '/home' && this.userService.isLoggedIn()) {
      this.router.navigate(['home']);
      return false;
    }
    return true;
  }
}
