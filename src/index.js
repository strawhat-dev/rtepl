import { REPL, initREPL } from './lib/index.js';

export const { REPL_MODE_SLOPPY, REPL_MODE_STRICT, Recoverable, writer } = REPL;
export const start = (options) => initREPL(options).start(options);
export class REPLServer extends REPL.REPLServer {
  constructor(options) {
    return new (initREPL(options).REPLServer)(options);
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
