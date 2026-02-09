/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';
import angular from '@analogjs/vite-plugin-angular';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

export default defineConfig(({ mode }) => {
  const isTestMode = mode === 'test';
  const loaded = loadEnv(mode, __dirname, '');
  const mergedEnv = {
    NG_APP_SUPABASE_URL:
      loaded.NG_APP_SUPABASE_URL ?? process.env.NG_APP_SUPABASE_URL ?? '',
    NG_APP_SUPABASE_ANON_KEY:
      loaded.NG_APP_SUPABASE_ANON_KEY ?? process.env.NG_APP_SUPABASE_ANON_KEY ?? '',
    NG_APP_SUPABASE_FUNCTIONS_URL:
      loaded.NG_APP_SUPABASE_FUNCTIONS_URL ??
      process.env.NG_APP_SUPABASE_FUNCTIONS_URL ??
      '',
    SUPABASE_DB_URL: loaded.SUPABASE_DB_URL ?? process.env.SUPABASE_DB_URL ?? '',
    SUPABASE_REMOTE_DB_URL:
      loaded.SUPABASE_REMOTE_DB_URL ?? process.env.SUPABASE_REMOTE_DB_URL ?? '',
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
    'import.meta.env.NG_APP_SUPABASE_URL': JSON.stringify(mergedEnv.NG_APP_SUPABASE_URL),
    'import.meta.env.NG_APP_SUPABASE_ANON_KEY': JSON.stringify(mergedEnv.NG_APP_SUPABASE_ANON_KEY),
    'import.meta.env.NG_APP_SUPABASE_FUNCTIONS_URL': JSON.stringify(
      mergedEnv.NG_APP_SUPABASE_FUNCTIONS_URL
    ),
    'import.meta.env.SUPABASE_DB_URL': JSON.stringify(mergedEnv.SUPABASE_DB_URL),
    'import.meta.env.SUPABASE_REMOTE_DB_URL': JSON.stringify(mergedEnv.SUPABASE_REMOTE_DB_URL),
  },
};
});
