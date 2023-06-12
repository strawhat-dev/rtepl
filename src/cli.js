#!/usr/bin/env -S node --experimental-network-imports --no-warnings

import { start } from './index.js';

start({
  useGlobal: true,
  breakEvalOnSigint: true,
  commands: {
    quit: ({ repl }) => (repl.close(), process.exit()),
    clear: ({ repl }) => repl.write(null, { ctrl: true, name: 'l' }),
  },
});
