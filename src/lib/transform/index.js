import { generate } from 'astring';
import { esbuild, parse } from './util.js';
import { dispatchAST } from './abstract-syntax-tree.js';

/**
 * @typedef {import('repl').REPLEval} REPLEval
 * @typedef {Parameters<REPLEval>} REPLParams
 * @type {import('rtepl').SetReturnType<REPLEval, Promise<REPLParams>>}
 */
export const transpileREPL = async (code, ...args) => {
  await esbuild(code, args[1]).then(transform).then(args.unshift.bind(args));
  return args;
};

/** @param {string} code */
const transform = (code) => {
  if (!/(\$`|\b(let|const|import|require)\b)/.test(code)) return code;
  try {
    const ast = parse(code);
    const len = ast.body?.length;
    for (let i = 0; i < len; ++i) {
      const statement = ast.body[i];
      const transformed = dispatchAST[statement?.type]?.(statement);
      transformed && (ast.body[i] = transformed);
    }

    code = generate(ast);
  } finally {
    return code;
  }
};
