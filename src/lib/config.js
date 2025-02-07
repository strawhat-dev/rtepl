import which from 'which';
import { readFile } from 'node:fs/promises';

/** @satisfies {import('node:fs').EncodingOption} */
const encoding = 'utf8';

/** @satisfies {Record<string, import('execa').Options>} */
export const shellConfig = /** @type {const} */ ({
  base: { encoding, reject: true, cleanup: true, extendEnv: true, preferLocal: false },
  repl: { stdio: 'inherit', stripFinalNewline: false, forceKillAfterDelay: 100 }, // tty shell
});

/** @satisfies {import('rtepl').ReplOptions} */
export const defaultConfig = /** @type {const} */ ({
  useGlobal: true,
  useColors: true,
  historySize: 1000,
  ignoreUndefined: true,
  theme: 'atom-one-dark',
});

/** @satisfies {import('yargs-parser').Options} */
export const parserOptions = /** @type {const} */ ({
  configuration: {
    'parse-numbers': false,
    'unknown-options-as-args': true,
  },
});

/**
 * @typedef {typeof commands} DefaultCommands
 * @satisfies {import('rtepl').ReplOptions['commands']}
 */
export const commands = /** @type {const} */ ({
  exit: ({ repl }) => repl.write(null, { ctrl: true, name: 'd' }),
  clear: ({ repl }) => (repl.write(null, { ctrl: true, name: 'l' }), repl.resume()),
  // prettier-ignore
  cd({ ansi, repl, args }) {
    repl.clearBufferedCommand();
    if ((args = args.trim())) {
      try { process.chdir(args); }
      catch { repl.setErrorPrompt(); }
    }
    console.log(ansi.blue.underline(process.cwd()));
    repl.resume();
  },
  ls({ $, argv }) {
    const flags = ['-A', '--group-directories-first', '--file-type', '--color=auto'];
    const ignore = ['ntuser*', 'NTUSER*', '.DS_Store'].map((pattern) => `--ignore='${pattern}'`);
    $`ls ${[...flags, ...ignore, ...argv]}`;
  },
  cat: ({ repl, args }) => {
    repl.clearBufferedCommand();
    readFile(args, { encoding }).then(console.log).catch(repl.setErrorPrompt).finally(repl.resume);
  },
  which({ repl, args }) {
    repl.clearBufferedCommand();
    which(args).then(console.log).catch(repl.setErrorPrompt).finally(repl.resume);
  },
  '?': ({ args, evaluate }, rest) => {
    args ||= 'undefined';
    const className = `${args}?.constructor?.name || Object.prototype.toString.call(${args})`;
    const highlightName = `ansi.bold.blue('<' + (${className}) + '>')`;
    const formatProps = `$.repl.formatColumns(getprops(${args}))`;
    return evaluate(`console.log(${highlightName}), ${formatProps}`, ...rest);
  },
});
