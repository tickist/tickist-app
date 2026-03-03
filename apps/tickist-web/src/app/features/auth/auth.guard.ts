import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseSessionService } from './supabase-session.service';

export const supabaseAuthGuard: CanActivateFn = async () => {
  const session = inject(SupabaseSessionService);
  const router = inject(Router);

  await session.waitUntilReady();

  if (session.user()) {
    return true;
  }

  return router.createUrlTree(['/auth']);
};
