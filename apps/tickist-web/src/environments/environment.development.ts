import {
  deriveSupabaseFunctionsUrl,
  readSupabaseEnv,
  readSupabaseEnvAny,
} from './environment.util';

const supabaseUrl = readSupabaseEnv('NG_APP_SUPABASE_URL', 'http://127.0.0.1:54321');
const fallbackFunctionsUrl = deriveSupabaseFunctionsUrl(
  supabaseUrl,
  'http://127.0.0.1:54321/functions/v1'
);

export const environment = {
  production: false,
  supabase: {
    url: supabaseUrl,
    publishableKey: readSupabaseEnvAny(
      ['NG_APP_SUPABASE_PUBLISHABLE_KEY', 'NG_APP_SUPABASE_ANON_KEY'],
      'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
    ),
    functionsUrl: readSupabaseEnv(
      'NG_APP_SUPABASE_FUNCTIONS_URL',
      fallbackFunctionsUrl
    ),
  },
};
