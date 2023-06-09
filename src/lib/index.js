import os from 'node:os';
import REPL from 'node:repl';
import chalk from 'chalk';
import parse from 'yargs-parser';
import findCacheDir from 'find-cache-dir';
import prettyREPL from './pretty-repl/index.js';
import { transpile } from './transform/index.js';

export const defaultREPL = REPL;

/** @param {REPL.ReplOptions} options */
export const initREPL = (options = {}) => {
  const stream = options.output || process.stdout;
  const instance = options.terminal ?? stream.isTTY ? prettyREPL : REPL;
  const { start } = instance;
  /** @param {REPL.ReplOptions} init */
  instance.start = (init = options) => {
    displayEnvironmentInfo();
    const { commands, closeOnSigint, extensions, ...serverConfig } = { ...defaultConfig, ...init };
    serverConfig.prompt ??= chalk.green('> ');
    const repl = start(serverConfig);
    const cache = findCacheDir({ name: 'rtepl', create: true });
    if (closeOnSigint) repl.on('SIGINT', repl.close);
    if (cache) {
      repl.setupHistory(`${cache}/.node_repl_history`, (err) => err && console.error(err));
    }

    const { eval: $ } = { ...repl };
    /** @type {REPL.REPLEval} */
    repl.eval = async (command, ...rest) => {
      const [commandName, ...argv] = parse(command, parserOptions)._;
      const args = command.replace(commandName, '').trim();
      const handleCommand = commands[commandName];
      if (handleCommand) return handleCommand({ repl, argv, args, command });
      return $(...(await transpile([command, ...rest], extensions)));
    };

    return repl;
  };

  return instance;
};

const displayEnvironmentInfo = () => {
  const [{ model }] = os.cpus();
  const nodeInfo = `node ${process.version}`;
  const osInfo = `${os.version()} ${os.machine()}`;
  const info = [nodeInfo, osInfo, model];
  console.log(chalk.green(info.join('\n')));
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
