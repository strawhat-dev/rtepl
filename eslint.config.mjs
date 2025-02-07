import js from '@eslint/js';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';
import { defineFlatConfig } from 'eslint-define-config';

export default defineFlatConfig([
  js.configs.recommended,
  importPlugin.flatConfigs.recommended,
  {
    files: ['**/*.js', '**/*.mjs'],
    settings: { 'import/resolver': 'node' },
    rules: {
      'no-empty': 0,
      'no-control-regex': 0,
    },
    languageOptions: {
      globals: globals.node,
      sourceType: 'module',
      ecmaVersion: 'latest',
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
        ecmaFeatures: { impliedStrict: true },
      },
    },
  },
]);
