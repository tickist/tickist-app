import { InjectionToken, Provider, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
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
        const anonKey = config.anonKey?.trim();
        const isPlaceholder =
          !url ||
          !anonKey ||
          url.includes('YOUR_DEV_PROJECT') ||
          anonKey.includes('anon-key');

        if (isPlaceholder) {
          console.warn(
            '[Supabase] Client not initialized. Configure NG_APP_SUPABASE_URL / NG_APP_SUPABASE_ANON_KEY.'
          );
          return null;
        }

        return createClient(url, anonKey, {
          auth: {
            persistSession: true,
            detectSessionInUrl: false,
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
