/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ['eslint:recommended'],
  env: { es2022: true, node: true },
  parserOptions: { sourceType: 'module', ecmaVersion: 2022 },
};
