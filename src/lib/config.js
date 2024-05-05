/** @type {import('repl').ReplOptions} */
export const defaultConfig = {
  theme: 'atom-one-dark',
  shell: 'bash',
  preview: false,
  useGlobal: true,
  ignoreUndefined: true,
  breakEvalOnSigint: true,
  extensions: {
    cdn: true,
    typescript: true,
    staticImports: true,
    redeclarations: true,
  },
};

/** @type {import('execa').Options<'utf8'>} */
export const execaOptions = {
  stdio: 'inherit',
  reject: false,
  cleanup: true,
  extendEnv: true,
  preferLocal: false,
  windowsHide: false,
};

/** @type {import('yargs-parser').Options} */
export const parserOptions = {
  configuration: {
    'parse-numbers': false,
    'unknown-options-as-args': true,
  },
};
