import { z } from 'zod';

declare global {
  var __env: Record<string, string | undefined> | undefined;
}

const getFromGlobal = (key: string): string | undefined => {
  const values = z
    .record(z.string(), z.string().optional())
    .safeParse(globalThis.__env);

  return values.success ? values.data[key] : undefined;
};

const getFromImportMeta = (key: string): string | undefined => {
  try {
    return import.meta.env?.[key];
  } catch {
    return undefined;
  }
};

const getFromProcess = (key: string): string | undefined => {
  // Available during SSR/build time
  if (typeof process !== 'undefined' && process?.env) {
    return process.env[key];
  }

  return undefined;
};

export const readSupabaseEnv = (key: string, fallback = ''): string => {
  return (
    getFromGlobal(key) ??
    getFromImportMeta(key) ??
    getFromProcess(key) ??
    fallback
  );
};

export const readSupabaseEnvAny = (keys: string[], fallback = ''): string => {
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
