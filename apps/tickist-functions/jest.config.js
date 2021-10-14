module.exports = {
    preset: "../../jest.preset.js",
    coverageDirectory: "../../../coverage/apps/tickist-web-functions",
    moduleFileExtensions: ["ts", "js", "html", "json"],
    globals: { "ts-jest": { tsconfig: "<rootDir>/tsconfig.spec.json" } },
    displayName: "tickist-functions",
    testEnvironment: "node",
};
