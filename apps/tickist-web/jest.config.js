module.exports = {
  name: 'tickist-web-web',
  preset: '../../jest.config.js',
  coverageDirectory: '../../coverage/apps/tickist-web-web',
  snapshotSerializers: [
    'jest-preset-angular/AngularSnapshotSerializer.js',
    'jest-preset-angular/HTMLCommentSerializer.js'
  ]
};
