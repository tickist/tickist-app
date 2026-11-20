import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/mcp',
  test: {
    name: 'mcp',
    environment: 'node',
    globals: true,
    include: ['src/**/*.spec.ts'],
    coverage: { provider: 'v8', reportsDirectory: '../../coverage/apps/mcp' },
  },
});
