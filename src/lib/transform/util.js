import { createRequire, isBuiltin } from 'node:module';
import { join } from 'node:path';
import { transform } from 'esbuild';
import { memoize } from '../util.js';

/** @type {(code: string) => import('meriyah').ESTree.Program} */
export const parse = await import('meriyah').then(({ parse }) =>
  memoize((code) => parse(code, parserOptions))
);

/** @param {string} code @param {string} sourcefile */
export const esbuild = async (code, sourcefile) => {
  const buildOptions = /** @type {const} */ ({ ...esconfig, sourcefile });
  ({ code } = await transform(code, buildOptions).catch(() => ({ code })));
  return code;
};

/** @param {string} name */
export const isUnresolvableImport = (name) => {
  if (
    isBuiltin(name) || // node.js builtins
    name.startsWith('./') || // relative-imports
    name.startsWith('https:') // network-imports
  ) return false;

  try {
    const require = createRequire(join(process.cwd(), 'index.js'));
    if (require.resolve(name)) return false;
  } catch {}

  return true;
};

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

/** @type {import('meriyah').Options} */
const parserOptions = {
  jsx: true,
  next: true,
  module: true,
  specDeviation: true,
  preserveParens: true,
};
