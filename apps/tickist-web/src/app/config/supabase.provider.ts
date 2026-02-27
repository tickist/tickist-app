import { InjectionToken, Provider, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  publishableKey: string;
  /** @deprecated Prefer publishableKey. */
  anonKey?: string;
  functionsUrl?: string;
}

export const SUPABASE_CONFIG = new InjectionToken<SupabaseConfig>(
  'SUPABASE_CONFIG'
);

export const SUPABASE_CLIENT = new InjectionToken<SupabaseClient | null>(
  'SUPABASE_CLIENT'
);

export function provideSupabase(config: SupabaseConfig): Provider[] {
  return [
    { provide: SUPABASE_CONFIG, useValue: config },
    {
      provide: SUPABASE_CLIENT,
      useFactory: () => {
        const platformId = inject(PLATFORM_ID);
        if (!isPlatformBrowser(platformId)) {
          return null;
        }

        const url = config.url?.trim();
        const publishableKey = (
          config.publishableKey ??
          config.anonKey ??
          ''
        ).trim();
        const isPlaceholder =
          !url ||
          !publishableKey ||
          url.includes('YOUR_DEV_PROJECT') ||
          publishableKey.includes('anon-key') ||
          publishableKey.includes('publishable-key');

        if (isPlaceholder) {
          console.warn(
            '[Supabase] Client not initialized. Configure NG_APP_SUPABASE_URL / NG_APP_SUPABASE_PUBLISHABLE_KEY.'
          );
          return null;
        }

        return createClient(url, publishableKey, {
          auth: {
            persistSession: true,
            detectSessionInUrl: true,
          },
          global: {
            headers: config.functionsUrl
              ? { 'x-functions-url': config.functionsUrl }
              : undefined,
          },
        });
      },
    },
  ];
}
