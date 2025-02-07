import { join } from 'node:path';
import { transform } from 'esbuild';
import { parse as meriyah } from 'meriyah';
import { createRequire, isBuiltin } from 'node:module';

/** @param {string} code */
export const parse = (code) => meriyah(code, parserOptions);

/** @param {string} code @param {string} sourcefile */
export const esbuild = async (code, sourcefile) => {
  const buildOptions = /** @type {const} */ ({ ...esconfig, sourcefile });
  ({ code } = await transform(code, buildOptions).catch(() => ({ code })));
  return code;
};

/** @param {string} identifier */
export const isUnresolvableImport = (identifier) => {
  if (
    isBuiltin(identifier) || // node.js builtins
    identifier.startsWith('./') || // relative-imports
    /^https?:\/\//.test(identifier) // network-imports
  ) return false;

  try {
    const require = createRequire(join(process.cwd(), 'index.js'));
    if (require.resolve(identifier)) return false;
  } catch {}

  return true;
};

/**
 * {@link https://github.com/privatenumber/tsx/blob/master/src/patch-repl.ts}
 * @satisfies {import('esbuild').TransformOptions}
 */
const esconfig = /** @type {const} */ ({
  minify: false,
  loader: 'tsx',
  format: 'esm',
  platform: 'node',
  target: 'node20',
  jsx: 'automatic',
  define: { require: 'global.require' },
  tsconfigRaw: { compilerOptions: { preserveValueImports: true } },
});

/** @satisfies {import('meriyah').Options} */
const parserOptions = /** @type {const} */ ({
  jsx: true,
  next: true,
  module: true,
  specDeviation: true,
  preserveParens: true,
});
