/** @type {import('rtepl').ReplOptions} */
export const defaultConfig = {
  useGlobal: true,
  useColors: true,
  historySize: 1000,
  ignoreUndefined: true,
  theme: 'atom-one-dark',
  extensions: {
    cdn: true,
    typescript: true,
    staticImports: true,
    redeclarations: true,
  },
};

/** @type {import('yargs-parser').Options} */
export const parserOptions = {
  configuration: {
    'parse-numbers': false,
    'unknown-options-as-args': true,
  },
};

export const execaOptions = /** @type {const} */ ({
  reject: true,
  cleanup: true,
  extendEnv: true,
  preferLocal: false,
  windowsHide: false,
});
