/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  rules: { 'no-empty': 0 },
  extends: ['eslint:recommended'],
  env: { es2022: true, node: true },
  parserOptions: { sourceType: 'module', ecmaVersion: 'latest' },
};
