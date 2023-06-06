import REPL from 'node:repl';
import prettyREPL from './pretty-repl/index.js';
import { transpile } from './transform/index.js';

export const defaultREPL = REPL;

/** @param {REPL.ReplOptions} options */
export const initREPL = (options = {}) => {
  const stream = options.output || process.stdout;
  const repl = options.terminal ?? stream.isTTY ? prettyREPL : REPL;
  const { start } = repl;
  repl.start = ({ extensions, ...rest } = options) => {
    const server = start(rest);
    const { eval: $ } = { ...server };
    server.eval = async (...args) => $(...(await transpile(args, extensions)));
    return server;
  };

  return repl;
};
