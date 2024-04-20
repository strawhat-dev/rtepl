#!/usr/bin/env -S node --no-warnings --experimental-network-imports

import { start } from './index.js';
import { blue } from './lib/ansi.js';
import { normalize } from 'node:path';

start({
  breakEvalOnSigint: true,
  commands: {
    exit: ({ repl }) => (repl.close(), process.exit()),
    clear: ({ repl }) => repl.write(null, { ctrl: true, name: 'l' }),
    ls({ argv }) {
      const flags = ['-A ', '--color=auto', '--classify=auto', '--group-directories-first'];
      $`ls ${[...flags, ...argv]}`;
    },
    cd({ repl, args }) {
      try {
        repl.clearBufferedCommand();
        process.chdir(normalize(args));
        console.log(blue.underline(normalize(process.cwd())));
      } catch (_) {
        repl.setErrorPrompt();
      } finally {
        repl.displayPrompt(true);
      }
    },
  },
});
