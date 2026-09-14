// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/**", ".expo/**"],
    rules: {
      // These patterns synchronize derived UI state and event-time cache state.
      // React Compiler handles them correctly; retain warnings for future refactors.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
    },
  }
]);
