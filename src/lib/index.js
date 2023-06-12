import parse from 'yargs-parser';
import findCacheDir from 'find-cache-dir';
import { transpileREPL } from './transform/index.js';
import { displayEnvironmentInfo, extend } from './util.js';
import prettyREPL, { defaultREPL } from './pretty-repl/index.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

/** @type {import('repl').ReplOptions} */
const defaultConfig = {
  theme: 'atom-one-dark',
  extensions: {
    cdn: true,
    typescript: true,
    staticImports: true,
    redeclarations: true,
  },
};

/** @type {import('yargs-parser').Options} */
const parserOptions = {
  configuration: {
    'parse-numbers': false,
    'unknown-options-as-args': true,
  },
};

/** @internal */
export const REPL = defaultREPL;

/** @internal */
export const initREPL = (init = {}) => {
  const isTTY = init.terminal ?? (init.output ?? process.stdout)?.isTTY;
  const instance = isTTY ? prettyREPL : defaultREPL;
  const { start } = instance;
  /** @param {import('repl').ReplOptions} options */
  instance.start = (options = {}) => {
    const config = { ...defaultConfig, ...init, ...options };
    const { commands, extensions, ...server } = config;
    const repl = (displayEnvironmentInfo(), start(server));
    repl.setupHistory(
      `${findCacheDir({
        name: 'rtepl',
        create: true,
        cwd: dirname(fileURLToPath(import.meta.url)),
      })}/.node_repl_history`,
      () => 0
    );

    extend(global, { $repl: repl });
    const { eval: $ } = { ...repl };
    /** @type {import('repl').REPLEval} */
    repl.eval = async (command, ...rest) => {
      const [commandName, ...argv] = parse(command, parserOptions)._;
      const handleCommand = commands[commandName];
      const args = command.replace(commandName, '').trim();
      if (handleCommand) return handleCommand({ repl, command, args, argv, _: rest });
      return $(...(await transpileREPL([command, ...rest], extensions)));
    };

    return repl;
  };

  return instance;
};
