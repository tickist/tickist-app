module.exports = {
  testMatch: ['**/+(*.)+(spec|test).+(ts|js)?(x)'],
  transform: {
    '^.+\\.(ts|js|html)$': 'ts-jest'
  },
  resolver: '@nrwl/jest/plugins/resolver',
  moduleFileExtensions: ['ts', 'js', 'html', 'node'],
  coverageReporters: ['html'],
  testEnvironment: 'jsdom',
  passWithNoTests: true,
};

module.exports.globals = {
  'ts-jest': {
    tsConfig: 'tsconfig.json',
    stringifyContentPathRegex: '\\.html$',
    astTransformers: [require.resolve('jest-preset-angular/InlineHtmlStripStylesTransformer')]
  }
};
