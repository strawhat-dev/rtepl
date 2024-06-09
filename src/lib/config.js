import which from 'which';
import { readFile } from 'node:fs/promises';

const read = async (file) => readFile(file, { encoding: 'utf-8' });

export const shellConfig = /** @type {const} */ ({
  base: { reject: true, cleanup: true, extendEnv: true, preferLocal: false, windowsHide: false },
  repl: { stdio: 'inherit', stripFinalNewline: false, forceKillAfterDelay: 100 }, // tty shell
});

/** @type {import('rtepl').ReplOptions} */
export const defaultConfig = {
  useGlobal: true,
  useColors: true,
  historySize: 1000,
  ignoreUndefined: true,
  theme: 'atom-one-dark',
};

/** @type {import('yargs-parser').Options} */
export const parserOptions = {
  configuration: {
    'parse-numbers': false,
    'unknown-options-as-args': true,
  },
};

/**
 * @typedef {typeof commands} DefaultCommands
 * @type {import('rtepl').ReplOptions['commands']}
 */
export const commands = {
  exit: ({ repl }) => repl.write(null, { ctrl: true, name: 'd' }),
  clear: ({ repl }) => (repl.write(null, { ctrl: true, name: 'l' }), repl.resume()),
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
      process.chdir(args);
      console.log(ansi.blue.underline(process.cwd()));
    } catch {
      repl.setErrorPrompt();
    } finally {
      repl.resume();
    }
  },
  '?': ({ args, evaluate }, rest) => {
    args ||= 'undefined';
    const className = `${args}?.constructor?.name || Object.prototype.toString.call(${args})`;
    const highlightName = `ansi.bold.blue('<' + (${className}) + '>')`;
    const formatProps = `$.repl.formatColumns(getprops(${args}))`;
    return evaluate(`console.log(${highlightName}), ${formatProps}`, ...rest);
  },
};
