/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  rules: { 'no-empty': 0 },
  extends: ['eslint:recommended'],
  env: { es2022: true, node: true },
  globals: { clog: 'readonly', rtepl_cdn_imports: 'readonly' },
  parserOptions: { sourceType: 'module', ecmaVersion: 'latest' },
};
