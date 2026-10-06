import { z } from 'zod';

type PublicEnvKey =
  | 'NG_APP_SUPABASE_URL'
  | 'NG_APP_SUPABASE_PUBLISHABLE_KEY'
  | 'NG_APP_SUPABASE_ANON_KEY'
  | 'NG_APP_SUPABASE_FUNCTIONS_URL'
  | 'NG_APP_GA4_MEASUREMENT_ID'
  | 'NG_APP_CLOUDFLARE_ANALYTICS_TOKEN'
  | 'NG_APP_BUILD_COMMIT';

declare global {
  var __env: Record<string, string | undefined> | undefined;
}

const getFromGlobal = (key: PublicEnvKey): string | undefined => {
  const values = z
    .record(z.string(), z.string().optional())
    .safeParse(globalThis.__env);

  return values.success ? values.data[key] : undefined;
};

const getFromImportMeta = (key: PublicEnvKey): string | undefined => {
  switch (key) {
    case 'NG_APP_SUPABASE_URL':
      return import.meta.env.NG_APP_SUPABASE_URL;
    case 'NG_APP_SUPABASE_PUBLISHABLE_KEY':
      return import.meta.env.NG_APP_SUPABASE_PUBLISHABLE_KEY;
    case 'NG_APP_SUPABASE_ANON_KEY':
      return import.meta.env.NG_APP_SUPABASE_ANON_KEY;
    case 'NG_APP_SUPABASE_FUNCTIONS_URL':
      return import.meta.env.NG_APP_SUPABASE_FUNCTIONS_URL;
    case 'NG_APP_GA4_MEASUREMENT_ID':
      return import.meta.env.NG_APP_GA4_MEASUREMENT_ID;
    case 'NG_APP_CLOUDFLARE_ANALYTICS_TOKEN':
      return import.meta.env.NG_APP_CLOUDFLARE_ANALYTICS_TOKEN;
    case 'NG_APP_BUILD_COMMIT':
      return import.meta.env.NG_APP_BUILD_COMMIT;
  }
};

const getFromProcess = (key: PublicEnvKey): string | undefined => {
  // Available during SSR/build time
  if (typeof process !== 'undefined' && process?.env) {
    return process.env[key];
  }

  return undefined;
};

export const readSupabaseEnv = (key: PublicEnvKey, fallback = ''): string => {
  return (
    getFromGlobal(key) ??
    getFromImportMeta(key) ??
    getFromProcess(key) ??
    fallback
  );
};

export const readSupabaseEnvAny = (
  keys: PublicEnvKey[],
  fallback = ''
): string => {
  for (const key of keys) {
    const value = readSupabaseEnv(key);

    if (value !== '') {
      return value;
    }
  }

  return fallback;
};

export const deriveSupabaseFunctionsUrl = (
  supabaseUrl: string,
  fallback = ''
): string => {
  const trimmed = supabaseUrl.trim();

  if (!trimmed) {
    return fallback;
  }

  try {
    const parsed = new URL(trimmed);

    return `${parsed.origin}/functions/v1`;
  } catch {
    return fallback;
  }
};
