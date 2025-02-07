import { generate } from 'astring';
import { simple as walk } from 'acorn-walk';
import { nodeDispatch } from './abstract-syntax-tree.js';
import { esbuild, parse } from './util.js';
import { memo } from '../util.js';

const { keys } = Object;

const TRANSFORM_REGEX = /^\$`.*`;?\s*$|\b(?:let|const|import|require)\b/;

/** @type {(code: string, sourcefile: string) => Promise<string>} */
export const transpileREPL = memo(
  async (code, sourcefile) => esbuild(code, sourcefile).then(transform),
  { isPromise: true, transformKey: (args) => args.concat(keys(global).filter((key) => key.startsWith('https://cdn'))) }
);

// prettier-ignore
/** @param {string} code */
const transform = (code) => {
  if (TRANSFORM_REGEX.test(code)) try {
    const ast = parse(code);
    walk(ast, nodeDispatch);
    return generate(ast);
  } catch {}

  return code;
};
