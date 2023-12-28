import { CanActivateFn, Router } from "@angular/router";
import { inject } from "@angular/core";
import { AuthService } from "../../modules/auth/services/auth.service";
import { map } from "rxjs/operators";

export function loggedInGuard(): CanActivateFn {
    return () => {
        const authService: AuthService = inject(AuthService);
        const router: Router = inject(Router);
        return authService.authState$.pipe(
            map((state) => {
                if (state !== null) {
                    return true;
                }
                router.navigate(["login"]);
                return false;
            }),
        );
    };
}
