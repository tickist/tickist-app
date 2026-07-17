/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';
import { execSync } from 'child_process';
import angular from '@analogjs/vite-plugin-angular';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { VitePWA } from 'vite-plugin-pwa';

const resolveBuildCommit = (loaded: Record<string, string>): string => {
  const explicitCommit =
    loaded.NG_APP_BUILD_COMMIT ??
    process.env.NG_APP_BUILD_COMMIT ??
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.CF_PAGES_COMMIT_SHA ??
    process.env.GITHUB_SHA ??
    '';

  if (explicitCommit.trim()) {
    return explicitCommit.trim();
  }

  try {
    return execSync('git rev-parse HEAD', {
      cwd: resolve(__dirname, '../..'),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'unknown';
  }
};

export default defineConfig(({ mode }) => {
  const isTestMode = mode === 'test';
  const loaded = loadEnv(mode, __dirname, '');
  const mergedEnv = {
    NG_APP_SUPABASE_URL:
      loaded.NG_APP_SUPABASE_URL ?? process.env.NG_APP_SUPABASE_URL ?? '',
    NG_APP_SUPABASE_PUBLISHABLE_KEY:
      loaded.NG_APP_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NG_APP_SUPABASE_PUBLISHABLE_KEY ??
      loaded.NG_APP_SUPABASE_ANON_KEY ??
      process.env.NG_APP_SUPABASE_ANON_KEY ??
      '',
    // Backward compatibility for local scripts still relying on legacy variable name.
    NG_APP_SUPABASE_ANON_KEY:
      loaded.NG_APP_SUPABASE_ANON_KEY ??
      process.env.NG_APP_SUPABASE_ANON_KEY ??
      loaded.NG_APP_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NG_APP_SUPABASE_PUBLISHABLE_KEY ??
      '',
    NG_APP_SUPABASE_FUNCTIONS_URL:
      loaded.NG_APP_SUPABASE_FUNCTIONS_URL ??
      process.env.NG_APP_SUPABASE_FUNCTIONS_URL ??
      '',
    SUPABASE_DB_URL:
      loaded.SUPABASE_DB_URL ?? process.env.SUPABASE_DB_URL ?? '',
    SUPABASE_REMOTE_DB_URL:
      loaded.SUPABASE_REMOTE_DB_URL ?? process.env.SUPABASE_REMOTE_DB_URL ?? '',
    NG_APP_BUILD_COMMIT: resolveBuildCommit(loaded),
  };
  return {
    root: __dirname,
    cacheDir: '../../node_modules/.vite/tickist-web',
    plugins: [
      angular({
        tsconfig: resolve(
          __dirname,
          isTestMode ? 'tsconfig.spec.json' : 'tsconfig.app.json'
        ),
      }),
      nxViteTsPaths(),
      nxCopyAssetsPlugin(['../../*.md']),
      VitePWA({
        disable: isTestMode,
        registerType: 'prompt',
        injectRegister: false,
        includeAssets: ['favicon.png'],
        manifest: {
          id: '/',
          name: 'Tickist',
          short_name: 'Tickist',
          description: 'A focused task and project manager.',
          lang: 'en',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          background_color: '#0f172a',
          theme_color: '#0f172a',
          categories: ['productivity', 'utilities'],
          icons: [
            {
              src: '/icons/icon-72x72.png',
              sizes: '72x72',
              type: 'image/png',
            },
            {
              src: '/icons/icon-96x96.png',
              sizes: '96x96',
              type: 'image/png',
            },
            {
              src: '/icons/icon-128x128.png',
              sizes: '128x128',
              type: 'image/png',
            },
            {
              src: '/icons/icon-144x144.png',
              sizes: '144x144',
              type: 'image/png',
            },
            {
              src: '/icons/icon-152x152.png',
              sizes: '152x152',
              type: 'image/png',
            },
            {
              src: '/icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable',
            },
            {
              src: '/icons/icon-384x384.png',
              sizes: '384x384',
              type: 'image/png',
            },
            {
              src: '/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: false,
          globPatterns: ['**/*.{css,html,ico,js,json,png,svg,webp,woff,woff2}'],
          globIgnores: [
            '**/env.js',
            'favicon.png',
            'icons/*.png',
            'manifest.webmanifest',
          ],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/env\.js$/, /^\/mcp(?:\/|$)/],
        },
      }),
    ],
    build: {
      outDir: '../../dist/tickist-web',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'src/main.ts'),
          index: resolve(__dirname, 'index.html'),
        },
      },
    },
    // Uncomment this if you are using workers.
    // worker: {
    //  plugins: [ nxViteTsPaths() ],
    // },
    test: {
      name: 'tickist-web',
      watch: false,
      globals: true,
      environment: 'jsdom',
      include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      setupFiles: ['src/test-setup.ts'],
      reporters: ['default'],
      coverage: {
        reportsDirectory: './coverage/tickist-web',
        provider: 'v8',
      },
    },
    define: {
      'import.meta.env.NG_APP_SUPABASE_URL': JSON.stringify(
        mergedEnv.NG_APP_SUPABASE_URL
      ),
      'import.meta.env.NG_APP_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(
        mergedEnv.NG_APP_SUPABASE_PUBLISHABLE_KEY
      ),
      'import.meta.env.NG_APP_SUPABASE_ANON_KEY': JSON.stringify(
        mergedEnv.NG_APP_SUPABASE_ANON_KEY
      ),
      'import.meta.env.NG_APP_SUPABASE_FUNCTIONS_URL': JSON.stringify(
        mergedEnv.NG_APP_SUPABASE_FUNCTIONS_URL
      ),
      'import.meta.env.SUPABASE_DB_URL': JSON.stringify(
        mergedEnv.SUPABASE_DB_URL
      ),
      'import.meta.env.SUPABASE_REMOTE_DB_URL': JSON.stringify(
        mergedEnv.SUPABASE_REMOTE_DB_URL
      ),
      'import.meta.env.NG_APP_BUILD_COMMIT': JSON.stringify(
        mergedEnv.NG_APP_BUILD_COMMIT
      ),
    },
  };
});
