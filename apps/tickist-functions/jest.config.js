module.exports = {
  preset: "../../jest.preset.js",
  coverageDirectory: "../../../coverage/apps/tickist-web-functions",
  moduleFileExtensions: ["ts", "js", "html", "json"],
  globals: { "ts-jest": { tsConfig: "<rootDir>/tsconfig.spec.json" } },
  displayName: "tickist-functions",
};
