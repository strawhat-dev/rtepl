import which from 'which';
import { normalize } from 'node:path';
import { readFile } from 'node:fs/promises';

const read = async (file) => readFile(normalize(file), { encoding: 'utf-8' });

/** @type {import('yargs-parser').Options} */
export const parserOptions = {
  configuration: {
    'parse-numbers': false,
    'unknown-options-as-args': true,
  },
};

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

export const execaOptions = /** @type {const} */ ({
  reject: true,
  cleanup: true,
  extendEnv: true,
  preferLocal: false,
  windowsHide: false,
});

/**
 * @typedef {typeof commands} DefaultCommands
 * @type {import('rtepl').ReplOptions['commands']}
 */
export const commands = {
  exit: ({ repl }) => repl.write(null, { ctrl: true, name: 'd' }),
  clear: ({ repl }) => repl.write('\x1bc', { ctrl: true, name: 'l' }),
  '?': ({ args, next }, rest) => {
    const showProps = `$.repl.formatColumns(props(${args}))`;
    const showType = `ansi.bold.blue(Object.prototype.toString.call(${args}))`;
    return next(`console.log(${showType}), console.log(${showProps})`, ...rest);
  },
  cat: ({ repl, args }) => {
    repl.clearBufferedCommand();
    read(args).then(console.log).catch(repl.setErrorPrompt).finally(repl.resume);
  },
  which({ repl, args }) {
    repl.clearBufferedCommand();
    which(args).then(console.log).catch(repl.setErrorPrompt).finally(repl.resume);
  },
  ls({ $, argv }) {
    const flags = ['-A', '--group-directories-first', '--file-type', '--color=auto'];
    const ignore = ['ntuser*', 'NTUSER*', '.DS_Store'].map((pattern) => `--ignore='${pattern}'`);
    $`ls ${[...flags, ...ignore, ...argv]}`;
  },
  cd({ ansi, repl, args }) {
    try {
      repl.clearBufferedCommand();
      process.chdir(normalize(args));
      console.log(ansi.blue.underline(process.cwd()));
    } catch (_) {
      repl.setErrorPrompt();
    } finally {
      repl.resume();
    }
  },
};
