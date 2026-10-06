import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { EmailMonitoringService } from '../../data/email-monitoring.service';
import { SupabaseSessionService } from '../auth/supabase-session.service';

export const administratorGuard: CanActivateFn = async () => {
  const monitor = inject(EmailMonitoringService);
  const session = inject(SupabaseSessionService);
  const router = inject(Router);
  await session.waitUntilReady();

  return (await monitor.checkAccess())
    ? true
    : router.createUrlTree(['/app/settings']);
};
