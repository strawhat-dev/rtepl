import memoize from 'memoize-one';
import { transform } from '@esbuild-kit/core-utils';
import { createRequire, isBuiltin } from 'node:module';
import { join } from 'node:path';

/** @type {import('meriyah')['parse']} */
export const parse = await import('meriyah').then((meriyah) => memoize(meriyah.parse));

/** @type {import('astring')['generate']} */
export const generate = await import('astring').then((astring) => memoize(astring.generate));

/**
 * @param {string} code
 * @param {string} sourcefile
 */
export const esbuild = async (code, sourcefile) => {
  const args = [code, sourcefile, { ...esconfig, sourcefile }];
  ({ code } = await transform(...args).catch(() => ({ code })));
  return code;
};

/**
 * @param {string} code
 * @param {import('repl').ReplOptions['extensions']} opts
 */
export const shouldSkipParsing = (code, opts) => (
  !/(\$`|\b(let|const|import|require)\b)/.test(code) || // naive check
  !Object.values(opts).some((enabled) => enabled)
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

/**
 * {@link https://github.com/privatenumber/tsx/blob/master/src/repl.ts}
 * @type {Parameters<transform>[2]}
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
