#!/usr/bin/env -S node --experimental-network-imports --no-warnings

import { start } from './index.js';

start({
  useGlobal: true,
  closeOnSigint: true,
  breakEvalOnSigint: true,
  commands: {
    clear: ({ repl }) => repl.write(null, { ctrl: true, name: 'l' }),
  },
});
