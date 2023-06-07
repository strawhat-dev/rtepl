import REPL from 'node:repl';
import chalk from 'chalk';
import findCacheDir from 'find-cache-dir';
import prettyREPL from './pretty-repl/index.js';
import { transpile } from './transform/index.js';

export const defaultREPL = REPL;

/** @param {REPL.ReplOptions} options */
export const initREPL = (options = {}) => {
  const stream = options.output || process.stdout;
  const repl = options.terminal ?? stream.isTTY ? prettyREPL : REPL;
  const { start } = repl;
  /** @param {REPL.ReplOptions} init */
  repl.start = (init = options) => {
    const { extensions, ...serverConfig } = { ...defaultConfig, ...init };
    stream.isTTY && (serverConfig.prompt ??= chalk.green('> '));
    const server = start(serverConfig);
    const { eval: $ } = { ...server };
    const cache = findCacheDir({ name: 'rtepl', create: true, thunk: true });
    server.eval = async (...args) => $(...(await transpile(args, extensions)));
    server.setupHistory(cache('.node_repl_history'), (err) => err && console.error(err));
    return server;
  };

  return repl;
};

/** @type {REPL.ReplOptions}  */
const defaultConfig = {
  useGlobal: true,
  breakEvalOnSigint: true,
  theme: 'atom-one-dark',
  extensions: {
    cdn: true,
    typescript: true,
    staticImports: true,
    redeclarations: true,
  },
};
