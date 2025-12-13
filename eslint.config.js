import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

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
    rules: {
      quotes: ['error', 'single', { allowTemplateLiterals: true, avoidEscape: true }],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
]);
