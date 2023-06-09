import { defaultREPL, initREPL } from './lib/index.js';

/** @param {import('repl').ReplOptions} options */
export const start = (options) => initREPL(options).start(options);

export class REPLServer extends defaultREPL.REPLServer {
  /** @param {import('repl').ReplOptions} options */
  constructor(options) {
    return new (initREPL(options).REPLServer)(options);
  }
}

// prettier-ignore
export const {
  writer,
  Recoverable,
  REPL_MODE_SLOPPY,
  REPL_MODE_STRICT,
} = defaultREPL;

/** @type {import('repl')} */
export default {
  start,
  REPLServer,
  REPL_MODE_SLOPPY,
  REPL_MODE_STRICT,
  Recoverable,
  writer,
};
