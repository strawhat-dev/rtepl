/** @type {import('repl').ReplOptions} */
export const defaultConfig = {
  preview: false,
  useGlobal: true,
  ignoreUndefined: true,
  theme: 'atom-one-dark',
  extensions: {
    cdn: true,
    typescript: true,
    staticImports: true,
    redeclarations: true,
  },
};

/** @type {import('execa').Options<'utf8'>} */
export const execOptions = {
  stdio: 'inherit',
  shell: 'bash',
  reject: false,
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
