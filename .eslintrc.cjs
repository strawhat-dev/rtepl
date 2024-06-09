const { defineConfig } = require('eslint-define-config');

module.exports = defineConfig({
  root: true,
  extends: ['eslint:recommended'],
  env: { node: true, es2022: true },
  parserOptions: { sourceType: 'module', ecmaVersion: 'latest' },
  rules: { 'no-empty': 0, 'no-cond-assign': 0, 'no-unsafe-finally': 0, 'no-control-regex': 0 },
});
