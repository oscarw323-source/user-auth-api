const { createDefaultPreset } = require("ts-jest");

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*-test.ts"],
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
  clearMocks: true,
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: {
          module: "commonjs",
        },
      },
    ],
  },
  moduleNameMapper: {
    "^uuid$": "<rootDir>/src/__tests__/mocks/uuid-mock.ts",
    "^../logger$": "<rootDir>/src/__tests__/mocks/logger-mock.ts",
    "^../../logger$": "<rootDir>/src/__tests__/mocks/logger-mock.ts",
    "^../application/totp-service$":
      "<rootDir>/src/__tests__/mocks/totp-mock.ts",
    "^../../application/totp-service$":
      "<rootDir>/src/__tests__/mocks/totp-mock.ts",
  },
};
