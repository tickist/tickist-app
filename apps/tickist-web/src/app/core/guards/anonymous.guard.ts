import { Router } from "@angular/router";
import { Injectable } from "@angular/core";
import { AuthService } from "../../modules/auth/services/auth.service";
import { map } from "rxjs/operators";
import { Observable } from "rxjs";
import { homeRoutesName } from "../../routing.module.name";
import { dashboardRoutesName } from "../../modules/dashboard/routes.names";

@Injectable()
export class AnonymousGuard {
    constructor(
        protected router: Router,
        private authService: AuthService,
    ) {}

    canActivate(): Observable<boolean> {
        return this.authService.authState$.pipe(
            map((state) => {
                if (state === null) {
                    return true;
                }
                this.router.navigate([homeRoutesName.home, dashboardRoutesName.dashboard]);
                return false;
            }),
        );
    }
}
