const getFromGlobal = (key: string): string | undefined => {
  const envSource = (globalThis as Record<string, unknown> | undefined)?.__env as
    | Record<string, string | undefined>
    | undefined;
  return envSource?.[key];
};

const getFromImportMeta = (key: string): string | undefined => {
  try {
    return (import.meta as ImportMeta | undefined)?.env?.[key];
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

export const readSupabaseEnvAny = (
  keys: string[],
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
