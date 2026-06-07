const { createCjsPreset } = require("jest-preset-angular/presets");

module.exports = {
  ...createCjsPreset(),

  testEnvironment: "jsdom",

  roots: ["<rootDir>/projects/whirli-ng/src"],

  setupFilesAfterEnv: ["<rootDir>/setup-jest.ts"],
};
