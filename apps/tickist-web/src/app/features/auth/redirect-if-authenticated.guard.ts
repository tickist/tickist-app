import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseSessionService } from './supabase-session.service';

export const redirectIfAuthenticatedGuard: CanActivateFn = async () => {
  const session = inject(SupabaseSessionService);
  const router = inject(Router);

  await session.waitUntilReady();

  if (session.user() && !session.passwordRecoveryPending()) {
    return router.createUrlTree(['/app']);
  }

  return true;
};
