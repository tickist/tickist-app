import {
  ApplicationConfig,
  ENVIRONMENT_INITIALIZER,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { appRoutes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
  withNoIncrementalHydration,
} from '@angular/platform-browser';
import { provideSupabase } from './config/supabase.provider';
import { environment } from '../environments/environment';
import { PasswordRecoveryFlowService } from './features/auth/password-recovery-flow.service';
import { AuthCallbackService } from './features/auth/auth-callback.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay(), withNoIncrementalHydration()),
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      appRoutes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
      })
    ),
    provideSupabase(environment.supabase),
    provideAppInitializer(() =>
      inject(AuthCallbackService).consumeCallbackUrl()
    ),
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => {
        inject(PasswordRecoveryFlowService);
      },
    },
  ],
};
