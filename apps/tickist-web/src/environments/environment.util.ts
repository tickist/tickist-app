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
