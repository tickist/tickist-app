import { readSupabaseEnv } from './environment.util';

export const environment = {
  production: false,
  supabase: {
    url: readSupabaseEnv('NG_APP_SUPABASE_URL', 'http://127.0.0.1:54321'),
    anonKey: readSupabaseEnv(
      'NG_APP_SUPABASE_ANON_KEY',
      'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
    ),
    functionsUrl: readSupabaseEnv(
      'NG_APP_SUPABASE_FUNCTIONS_URL',
      'http://127.0.0.1:54321/functions/v1'
    ),
  },
};
