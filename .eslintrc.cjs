/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: { node: true, es2022: true },
  extends: ['eslint:recommended'],
  parserOptions: { sourceType: 'module' },
  globals: { $repl: 'readonly', $log: 'readonly' },
  rules: {
    'no-empty': 0,
    'no-control-regex': 0,
  },
};
