import which from 'which';
import { $ as execa } from 'execa';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import findCacheDir from 'find-cache-dir';
import { shellConfig } from './config.js';
import { define } from './util.js';

const clipboard = await import('clipboardy').then(
  ({ default: cb }) => ({ read: cb.readSync, write: cb.write })
);

const pe = await import('pretty-error').then(({ default: PrettyError }) => {
  const pe = new PrettyError();
  return pe.skipNodeFiles(), pe;
});

const resolve_dynamic_module = (key, defaultImport, namedImport) => {
  const mod = global[key];
  defaultImport && (global[defaultImport] = mod.default || mod);
  return namedImport in mod ? mod : mod.default;
};

/** @param {import('rtepl').REPLServer} repl */
export const setupREPL = (repl) => {
  try {
    const cwd = dirname(fileURLToPath(import.meta.url));
    const dir = findCacheDir({ cwd, name: 'rtepl', create: true });
    dir && repl.setupHistory(join(dir, '.node_repl_history'), Boolean);
  } catch {}

  define(repl.context, { clipboard, resolve_dynamic_module });
  define(repl._domain._events, {
    error(error) {
      pe.render(error, true, true);
      repl.setErrorPrompt();
      repl.displayPrompt();
    },
  });

  return repl;
};

/** @param {import('rtepl').REPLServer} repl */
export const setupShell = (repl, shell = 'bash') => {
  shell = which.sync(shell, { nothrow: true });
  const spawn = execa({ ...shellConfig.base, shell });
  return define(spawn({ stdio: 'pipe' }), {
    repl,
    /** @param {readonly [TemplateStringsArray, ...any[]]} args  */
    run(...args) {
      const controller = new AbortController();
      const cancelSignal = controller.signal;
      const $ = spawn({ ...shellConfig.repl, cancelSignal });
      repl.on('SIGINT', controller.abort.bind(controller));
      $(...args).once('spawn', repl.clearBufferedCommand).on('exit', repl.resume);
    },
  });
};
