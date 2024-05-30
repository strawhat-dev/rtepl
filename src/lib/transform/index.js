import { esbuild, shouldSkipParsing, transpile } from './util.js';

/**
 * @param {Parameters<import('repl').REPLEval>} args
 * @param {import('repl').ReplOptions['extensions']} extensions
 */
export const transpileREPL = async (args, extensions) => {
  const { typescript, ...opts } = { ...extensions };
  if (typescript) args[0] = await esbuild(args[0], args[2]);
  if (shouldSkipParsing(args[0], opts)) return args;
  args[0] = transpile(args[0], opts);
  return args;
};
