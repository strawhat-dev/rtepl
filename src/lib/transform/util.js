import { createRequire, isBuiltin } from 'node:module';
import { transform } from '@esbuild-kit/core-utils';

// https://github.com/esbuild-kit/tsx/blob/develop/src/patch-repl.ts
/** @type {Parameters<typeof transform>[2]} */
const tsconfig = {
  minify: false,
  loader: 'tsx',
  format: 'esm',
  platform: 'node',
  target: 'node16',
  jsx: 'automatic',
  define: { require: 'global.require' },
  tsconfigRaw: { compilerOptions: { preserveValueImports: true } },
};

/**
 * @param {string} code
 * @param {string} file
 */
export const esbuild = async (code, file) => {
  ({ code } = await transform(code, file, tsconfig).catch(() => ({ code })));
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
 * @param {boolean} cdn
 */
export const isUnresolvableImport = (name, cdn) => {
  if (
    !cdn || // option disabled by user
    isBuiltin(name) || // node.js built-ins
    name.startsWith('.') || // relative-imports
    name.startsWith('https:') // network-imports
  ) {
    return false;
  }

  try {
    const require = createRequire(`${process.cwd()}/index.js`);
    if (require.resolve(name)) return false;
  } catch (_) {}

  return true;
};
