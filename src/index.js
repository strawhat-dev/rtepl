import REPL from 'node:repl';
import { register } from 'node:module';
import { initREPL } from './lib/index.js';
export { commands } from './lib/config.js';
export const { REPL_MODE_SLOPPY, REPL_MODE_STRICT, Recoverable, writer } = REPL;
export const start = (options) => initREPL().start(options);
export class REPLServer extends REPL.REPLServer {
  constructor(options) {
    return new (initREPL(options).REPLServer)();
  }
}

export default {
  start,
  REPLServer,
  REPL_MODE_SLOPPY,
  REPL_MODE_STRICT,
  Recoverable,
  writer,
};

register(
  './http-loader.mjs',
  new URL('../', import.meta.url)
);
