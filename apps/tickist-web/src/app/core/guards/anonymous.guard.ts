import { CanActivateFn, Router } from "@angular/router";
import { inject } from "@angular/core";
import { AuthService } from "../../modules/auth/services/auth.service";
import { map } from "rxjs/operators";
import { homeRoutesName } from "../../routing.module.name";
import { dashboardRoutesName } from "../../modules/dashboard/routes.names";

export function anonymousGuard(): CanActivateFn {
    return () => {
        const authService: AuthService = inject(AuthService);
        const router: Router = inject(Router);
        return authService.authState$.pipe(
            map((state) => {
                if (state === null) {
                    return true;
                }
                router.navigate([homeRoutesName.home, dashboardRoutesName.dashboard]);
                return false;
            }),
        );
    };
}
