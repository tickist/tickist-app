module.exports = {
  name: "tickist-web-functions",
  preset: "../../jest.config.js",
  coverageDirectory: "../../../coverage/apps/tickist-web-functions",
  moduleFileExtensions: ["ts", "js", "html", "json"],
  globals: { "ts-jest": { tsConfig: "<rootDir>/tsconfig.spec.json" } },
};
