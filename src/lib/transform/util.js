import { join } from 'node:path';
import { generate } from 'astring';
import { transform } from 'esbuild';
import { createRequire, isBuiltin } from 'node:module';
import { statementDispatch } from './abstract-syntax-tree.js';
import { memoize } from '../util.js';

/**
 * {@link https://github.com/privatenumber/tsx/blob/master/src/patch-repl.ts}
 * @type {import('esbuild').TransformOptions}
 */
const esconfig = {
  minify: false,
  loader: 'tsx',
  format: 'esm',
  platform: 'node',
  target: 'node20',
  jsx: 'automatic',
  define: { require: 'global.require' },
  tsconfigRaw: { compilerOptions: { preserveValueImports: true } },
};

/** @type {(code: string) => import('meriyah').ESTree.Program} */
const parse = await import('meriyah').then(({ parse }) =>
  memoize((code) => parse(code, { next: true, module: true, jsx: true, specDeviation: true }))
);

/**
 * @param {string} code
 * @param {string} sourcefile
 */
export const esbuild = async (code, sourcefile) => {
  ({ code } = await transform(code, { ...esconfig, sourcefile }).catch(() => ({ code })));
  return code;
};

/**
 * @param {string} code
 * @param {import('repl').ReplOptions['extensions']} opts
 */
export const transpile = (code, opts) => {
  try {
    const ast = parse(code);
    const len = ast.body?.length;
    for (let i = 0; i < len; ++i) {
      const statement = ast.body[i];
      const transformStatement = statementDispatch[statement?.type];
      transformStatement && (ast.body[i] = transformStatement(statement, opts));
    }

    return generate(ast);
  } catch {
    return code;
  }
};

/**
 * @param {string} code
 * @param {import('repl').ReplOptions['extensions']} opts
 */
export const shouldSkipParsing = (code, opts) => (
  !/(\$`|\b(let|const|import|require)\b)/.test(code) || // naive check
  !Object.values(opts).some(Boolean)
);

/**
 * @param {string} name
 * @param {boolean} enabled
 */
export const isUnresolvableImport = (name, enabled) => {
  if (
    !enabled || // option disabled by user
    isBuiltin(name) || // node.js builtins
    name.startsWith('./') || // relative-imports
    name.startsWith('https:') // network-imports
  ) {
    return false;
  }

  try {
    const require = createRequire(join(process.cwd(), 'index.js'));
    if (require.resolve(name)) return false;
  } catch (_) {}

  return true;
};
