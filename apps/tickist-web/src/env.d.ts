interface ImportMetaEnv {
  readonly NG_APP_SUPABASE_URL?: string;
  readonly NG_APP_SUPABASE_PUBLISHABLE_KEY?: string;
  /** @deprecated Prefer NG_APP_SUPABASE_PUBLISHABLE_KEY. */
  readonly NG_APP_SUPABASE_ANON_KEY?: string;
  readonly NG_APP_SUPABASE_FUNCTIONS_URL?: string;
  readonly NG_APP_GA4_MEASUREMENT_ID?: string;
  readonly NG_APP_CLOUDFLARE_ANALYTICS_TOKEN?: string;
  readonly NG_APP_TURNSTILE_SITE_KEY?: string;
  readonly NG_APP_BUILD_COMMIT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
