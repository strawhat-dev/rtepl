import os from 'node:os';
import parseCommand from 'yargs-parser';
import prettyREPL from './pretty-repl/index.js';
import { transpileREPL } from './transform/index.js';
import { defaultConfig, parserOptions } from './config.js';
import { setupREPL, setupShell } from './repl.js';
import { define, getprops } from './util.js';
import { ansi } from './ansi.js';

const { defineProperties } = Object;

export const initREPL = (init = {}) => {
  const instance = prettyREPL;
  const start = instance.start.bind(instance);
  return define(instance, {
    start(options = {}) {
      const underscore = Symbol('_');
      global[underscore] = global._;
      const { REPL_INIT_CWD } = process.env;
      REPL_INIT_CWD && process.chdir(REPL_INIT_CWD);
      const config = { ...defaultConfig, ...init, ...options };
      const { commands = {}, shell, ...server } = config;
      const repl = (displayEnvironmentInfo(), setupREPL(start(server)));
      const defaultEval = repl.eval.bind(repl);
      const $ = setupShell(repl, shell);
      return define(repl, {
        context: defineProperties(
          // repl context globals / utils
          define(repl.context, { $, ansi, getprops }),
          // allow assignment to "_" and skip warning message.
          { _: { get: () => global[underscore], set: (value) => global[underscore] = value } }
        ),
        async eval(cmd, ...rest) {
          const evaluate = async (...args) => {
            args.length || (args = [await transpileREPL(cmd, rest[1]), ...rest]);
            return defaultEval(...args);
          };

          repl.setDefaultPrompt();
          const [key, ...argv] = parseCommand(cmd, parserOptions)._;
          const args = cmd.replace(key, '').trim();
          const command = commands[key] || commands['*'];
          if (typeof command !== 'function') return evaluate();
          return command({ $: $.run, ansi, args, argv, cmd, evaluate, repl }, rest);
        },
      });
    },
  });
};

const displayEnvironmentInfo = () => {
  const platform = process.platform;
  const osInfo = platform === 'darwin' ? `${platform} v${os.release()}` : os.version();
  console.log(ansi.green`
  node ${process.version}
  ${osInfo} ${os.machine()}
  ${os.cpus().pop().model}
  `);
};

/**
 * @typedef {ReturnType<setupShell>} $
 * @typedef {prettyREPL['start']} REPLStart
 * @typedef {import('./pretty-repl/index.js').REPLServer} REPLServer
 */
