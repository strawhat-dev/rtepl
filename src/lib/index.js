import parseCommand from 'yargs-parser';
import { transpileREPL } from './transform/index.js';
import { defaultConfig, parserOptions } from './config.js';
import prettyREPL, { defaultREPL } from './pretty-repl/index.js';
import {
  define,
  displayEnvironmentInfo,
  initExeca,
  initHistory,
  resolve_global_module,
} from './util.js';

export { displayEnvironmentInfo };

export const REPL = defaultREPL;

export const initREPL = (init = {}) => {
  const isTTY = init.terminal ?? (init.output ?? process.stdout)?.isTTY;
  const instance = isTTY ? prettyREPL : defaultREPL;
  const start = instance.start.bind(instance);
  /** @param {import('repl').ReplOptions} options */
  instance.start = (options = {}) => {
    const config = { ...defaultConfig, ...init, ...options };
    const { shell, commands, extensions, ...server } = config;
    const repl = (displayEnvironmentInfo(), initHistory(start(server)));
    repl._domain.on('error', () => (repl.setErrorPrompt(), repl.displayPrompt(true)));
    const handleREPL = repl.eval.bind(repl);
    return define(repl, {
      context: define(repl.context, { $: initExeca(repl, shell), resolve_global_module, repl }),
      async eval(command, ...rest) {
        const next = async (...args) => {
          args.length || (args = await transpileREPL([command, ...rest], extensions));
          return handleREPL(...args);
        };

        repl.setDefaultPrompt();
        const [key, ...argv] = parseCommand(command, parserOptions)._;
        const args = command.replace(key, '').trim();
        const handleCommand = commands?.[key] || commands?.['*'];
        return handleCommand ? handleCommand({ command, args, argv, repl, next }, rest) : next();
      },
    });
  };

  return instance;
};
