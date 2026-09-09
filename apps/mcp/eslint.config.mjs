import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.spec.ts'],
    rules: { 'playwright/no-standalone-expect': 'off' },
  },
];
