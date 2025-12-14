import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

const tsConfigs = tseslint.configs.recommended.map((config) => ({
  ...config,
  files: ['src/**/*.{ts,mts,cts,tsx}'],
}));

export default defineConfig([
  {
    files: ['src/**/*.{js,mjs,cjs}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  ...tsConfigs,
  {
    files: ['src/**/*.{js,mjs,cjs,ts,mts,cts,tsx}'],
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      quotes: ['error', 'single', { allowTemplateLiterals: true, avoidEscape: true }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'simple-import-sort/imports': [
        'error',
        { groups: [['^\\u0000', '^node:', '^@?\\w', '^', '^\\.']] },
      ],
      'simple-import-sort/exports': 'error',
    },
  },
]);
