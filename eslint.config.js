import js from '@eslint/js';
import globals from 'globals';
import { defineConfig } from 'eslint/config';
import pluginCypress from 'eslint-plugin-cypress';

export default defineConfig({
  files: ['**/*.{js,mjs,cjs}'],
  plugins: { js, cypress: pluginCypress },
  extends: ['js/recommended', pluginCypress.configs.recommended],
  rules: {
    'cypress/unsafe-to-chain-command': 'error',
    quotes: ['error', 'single', { 'avoidEscape': true }]
  },
  languageOptions: {
    globals: {
      ...globals.browser,
      cy: 'readonly',
      describe: 'readonly',
      it: 'readonly',
      before: 'readonly',
      after: 'readonly',
    },
  },
});
