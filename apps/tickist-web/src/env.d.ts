interface ImportMetaEnv {
  readonly NG_APP_SUPABASE_URL?: string;
  readonly NG_APP_SUPABASE_PUBLISHABLE_KEY?: string;
  /** @deprecated Prefer NG_APP_SUPABASE_PUBLISHABLE_KEY. */
  readonly NG_APP_SUPABASE_ANON_KEY?: string;
  readonly NG_APP_SUPABASE_FUNCTIONS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
