import os from 'node:os';
import REPL from 'node:repl';
import chalk from 'chalk';
import parse from 'yargs-parser';
import findCacheDir from 'find-cache-dir';
import prettyREPL from './pretty-repl/index.js';
import { transpileREPL } from './transform/index.js';

// prettier-ignore
const displayEnvironmentInfo = () => (
  console.log(chalk.green(`
  node ${process.version}
  ${os.version()} ${os.machine()}
  ${os.cpus().pop().model}
  `))
);

export const defaultREPL = REPL;
export const initREPL = (init = {}) => {
  const stream = init.output || process.stdout;
  const instance = init.terminal ?? stream.isTTY ? prettyREPL : REPL;
  const { start } = instance;
  /** @param {REPL.ReplOptions} options */
  instance.start = (options = {}) => {
    const config = { ...defaultConfig, ...init, ...options };
    const { commands, extensions, closeOnSigint, ...server } = config;
    server.output ??= stream;
    server.output.isTTY && (server.prompt ??= chalk.green('> '));
    const repl = (displayEnvironmentInfo(), start(server));
    const cache = findCacheDir({ name: 'rtepl', create: true });
    if (closeOnSigint) repl.on('SIGINT', repl.close);
    if (cache) {
      repl.setupHistory(`${cache}/.node_repl_history`, (err) => err && clog`{red ${err}}`);
    }

    const { eval: $ } = { ...repl };
    /** @type {REPL.REPLEval} */
    repl.eval = async (command, ...rest) => {
      const [commandName, ...argv] = parse(command, parserOptions)._;
      const args = command.replace(commandName, '').trim();
      const handleCommand = commands[commandName];
      if (handleCommand) return handleCommand({ repl, argv, args, command });
      return $(...(await transpileREPL([command, ...rest], extensions)));
    };

    return repl;
  };

  return instance;
};

/** @type {import('yargs-parser').Options}  */
const parserOptions = {
  configuration: {
    'parse-numbers': false,
    'unknown-options-as-args': true,
  },
};

/** @type {REPL.ReplOptions}  */
const defaultConfig = {
  theme: 'atom-one-dark',
  extensions: {
    cdn: true,
    typescript: true,
    staticImports: true,
    redeclarations: true,
  },
};
