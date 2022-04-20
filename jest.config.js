module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  globalSetup: "./test/.jest.globalSetup.ts",
  globalTeardown: "./test/.jest.globalTeardown.ts",
  setupFilesAfterEnv: ["./test/.jest.setupAfterEnv.ts"],
  testPathIgnorePatterns: ["<rootDir>/dist/", "<rootDir>/node_modules/"],
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
};
