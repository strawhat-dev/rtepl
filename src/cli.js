#!/usr/bin/env -S node --experimental-network-imports --no-warnings

import { start } from './index.js';

start({
  breakEvalOnSigint: true,
  commands: {
    exit: ({ repl }) => (repl.close(), process.exit()),
    clear: ({ repl }) => repl.write(null, { ctrl: true, name: 'l' }),
    pwd({ repl }) {
      repl.clearBufferedCommand();
      $log`{blue.underline ${$path.normalize(process.cwd())}}`;
      repl.displayPrompt(true);
    },
    ls({ argv }) {
      const flags = ['-A ', '--color=auto', '--classify=auto', '--group-directories-first'];
      $`ls ${[...flags, ...argv]}`;
    },
    cd({ repl, args }) {
      try {
        repl.clearBufferedCommand();
        process.chdir($path.normalize(args));
        $log`{blue.underline ${$path.normalize(process.cwd())}}`;
      } catch (_) {
        repl.setErrorPrompt();
      } finally {
        repl.displayPrompt(true);
      }
    },
  },
});
