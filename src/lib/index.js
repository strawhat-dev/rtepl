import os from 'node:os';
import parseCommand from 'yargs-parser';
import prettyREPL from './pretty-repl/index.js';
import { transpileREPL } from './transform/index.js';
import { define, initExeca, props, setupREPL, sorted } from './util.js';
import { defaultConfig, parserOptions } from './config.js';
import { ansi } from './ansi.js';

export const initREPL = (init = {}) => {
  const instance = prettyREPL;
  const start = instance.start.bind(instance);
  return define(instance, {
    start(options = {}) {
      const { REPL_INIT_CWD } = process.env;
      REPL_INIT_CWD && process.chdir(REPL_INIT_CWD);
      const config = { ...defaultConfig, ...init, ...options };
      const { commands = {}, shell, extensions, ...server } = config;
      const repl = (displayEnvironmentInfo(), setupREPL(start(server)));
      repl._domain.on('error', () => (repl.setErrorPrompt(), repl.displayPrompt(true)));
      const defaultEval = repl.eval.bind(repl);
      const $ = initExeca(repl, shell);
      return define(repl, {
        context: define(repl.context, { $, ansi, props, sorted }),
        async eval(command, ...rest) {
          const next = async (...args) => {
            args.length || (args = await transpileREPL([command, ...rest], extensions));
            return defaultEval(...args);
          };

          repl.setDefaultPrompt();
          const [key, ...argv] = parseCommand(command, parserOptions)._;
          const args = command.replace(key, '').trim();
          const handleCommand = commands[key] || commands['*'];
          if (typeof handleCommand !== 'function') return next();
          return handleCommand({ $: $.run, ansi, args, argv, command, next, repl }, rest);
        },
      });
    },
  });
};

export const displayEnvironmentInfo = () => {
  const platform = process.platform;
  const osInfo = platform === 'darwin' ? `${platform} v${os.release()}` : os.version();
  console.log(ansi.green`
  node ${process.version}
  ${osInfo} ${os.machine()}
  ${os.cpus().pop().model}
  `);
};

/**
 * @typedef {ReturnType<initExeca>} $
 * @typedef {prettyREPL['start']} REPLStart
 * @typedef {import('./pretty-repl/index.js').REPLServer} REPLServer
 */
