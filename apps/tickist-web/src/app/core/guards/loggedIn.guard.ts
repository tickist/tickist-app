import { Router } from "@angular/router";

import { Injectable } from "@angular/core";

import { AuthService } from "../../modules/auth/services/auth.service";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Injectable()
export class LoggedInGuard {
    constructor(
        protected router: Router,
        private authService: AuthService,
    ) {}

    canActivate(): Observable<boolean> {
        return this.authService.authState$.pipe(
            map((state) => {
                if (state !== null) {
                    return true;
                }
                this.router.navigate(["login"]);
                return false;
            }),
        );
    }
}
