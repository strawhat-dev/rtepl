import REPL from 'node:repl';
import findCacheDir from 'find-cache-dir';
import prettyREPL from './pretty-repl/index.js';
import { transpile } from './transform/index.js';

export const defaultREPL = REPL;

/** @param {REPL.ReplOptions} options */
export const initREPL = (options = {}) => {
  const stream = options.output || process.stdout;
  const repl = options.terminal ?? stream.isTTY ? prettyREPL : REPL;
  const { start } = repl;
  repl.start = ({ extensions, ...serverConfig } = options) => {
    const server = start(serverConfig);
    const cache = findCacheDir({ name: 'rtepl', create: true, thunk: true });
    server.setupHistory(cache('.node_repl_history'), (err) => err && console.error(err));
    const { eval: $ } = { ...server };
    server.eval = async (...args) => $(...(await transpile(args, extensions)));
    return server;
  };

  return repl;
};
