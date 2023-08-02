import parseCommand from 'yargs-parser';
import $path from './path/index.js';
import { transpileREPL } from './transform/index.js';
import prettyREPL, { defaultREPL } from './pretty-repl/index.js';
import { displayEnvironmentInfo, extend, withExec, withHistory } from './util.js';
import { defaultConfig, parserOptions } from './config.js';

export const REPL = defaultREPL;

export const initREPL = (init = {}) => {
  const isTTY = init.terminal ?? (init.output ?? process.stdout)?.isTTY;
  const instance = isTTY ? prettyREPL : defaultREPL;
  const start = instance.start.bind(instance);
  /** @param {import('repl').ReplOptions} options */
  instance.start = (options = {}) => {
    const config = { ...defaultConfig, ...init, ...options };
    const { commands, extensions, ...server } = config;
    const repl = (displayEnvironmentInfo(), withHistory(start(server)));
    extend(global, { $repl: repl, $: withExec(repl), $path, $resolve_global_module });
    repl._domain.on('error', () => (repl.setErrorPrompt(), repl.displayPrompt(true)));
    const handleREPL = repl.eval.bind(repl);
    /** @type {import('repl').REPLEval} */
    repl.eval = async (command, ...rest) => {
      repl.setDefaultPrompt();
      const [commandName, ...argv] = parseCommand(command, parserOptions)._;
      const handleCommand = commands?.[commandName];
      const args = command.replace(commandName, '').trim();
      if (handleCommand) return handleCommand({ repl, command, args, argv, _: rest });
      return handleREPL(...(await transpileREPL([command, ...rest], extensions)));
    };

    return repl;
  };

  return instance;
};

const $resolve_global_module = (key, defaultImport, namedImport) => {
  const mod = global[key];
  defaultImport && (global[defaultImport] = mod.default ?? mod);
  return namedImport in mod ? mod : mod.default;
};
