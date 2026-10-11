const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  { ignores: ['android/**', 'ios/**', '.expo/**', '.devin/artifacts/**', '.devin/tools/**'] },
  { files: ['supabase/functions/keeper/index.ts'], languageOptions: { globals: { Deno: 'readonly' } } },
]);
