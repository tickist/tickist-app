module.exports = {
    name: 'tickist-web',
    preset: '../../jest.config.js',
    coverageDirectory: '../../coverage/apps/tickist-web',
    snapshotSerializers: [
        'jest-preset-angular/AngularSnapshotSerializer.js',
        'jest-preset-angular/HTMLCommentSerializer.js'
    ],
    setupFilesAfterEnv: ['./src/test-setup.ts'],
};
