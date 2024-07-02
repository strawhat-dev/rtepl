import { generate } from 'astring';
import { simple as walk } from 'acorn-walk';
import { esbuild, parse } from './util.js';
import { nodeDispatch } from './abstract-syntax-tree.js';

const TRANSFORM_REGEX = /^\$`.*`\s*$|\b(?:let|const|import|require)\b/;

/**
 * @typedef {import('repl').REPLEval} REPLEval
 * @typedef {Parameters<REPLEval>} REPLParams
 * @type {import('rtepl').SetReturnType<REPLEval, Promise<REPLParams>>}
 */
export const transpileREPL = async (code, ...args) => (
  esbuild(code, args[1]).then(transform).then(args.unshift.bind(args)).then(() => args)
);

// prettier-ignore
const transform = async (code) => (
  new Promise((resolve) => {
    if (TRANSFORM_REGEX.test(code)) try {
      const ast = parse(code);
      walk(ast, nodeDispatch);
      code = generate(ast);
    } catch {}

    return resolve(code);
  })
);
