import chalk from 'chalk';
import { createRequire, isBuiltin } from 'node:module';
import { transform } from '@esbuild-kit/core-utils';
import {
  dynamicImportDeclaration,
  initProp,
  resolvedImportDeclaration,
} from './abstract-syntax-tree.js';

// https://github.com/esbuild-kit/tsx/blob/develop/src/patch-repl.ts
/** @type {Parameters<typeof transform>[2]} */
const tsconfig = {
  minify: false,
  loader: 'tsx',
  format: 'esm',
  jsx: 'automatic',
  target: 'node16',
  platform: 'neutral',
  define: { require: 'global.require' },
  tsconfigRaw: { compilerOptions: { preserveValueImports: true } },
};

/**  @param {Parameters<import('repl').REPLEval>} */
export const esbuild = async (code, file) => {
  ({ code } = await transform(code, file, tsconfig).catch(() => ({ code })));
  return code;
};

/**
 * @param {string} code
 * @param {import('repl').ReplOptions['extensions']} opts
 */
// prettier-ignore
export const shouldSkipParsing = (code, opts) => (
  !Object.values(opts).some((enabled) => enabled) || // naive check
  !['let', 'const', 'import', 'require'].some((keyword) => code.includes(keyword))
);

/**
 * @param {string} name
 * @param {object} props
 */
export const getImportDeclaration = (name, props, cdn = true) => {
  if (globalThis['cdn_imports']?.has(name)) {
    return resolvedImportDeclaration(globalThis['cdn_imports'].get(name), props);
  }

  const resolved = resolveModule(name, cdn);
  return dynamicImportDeclaration(resolved, props);
};

/**
 * @param {{
 *   name?: string,
 *   properties?: ReturnType<typeof initProp>[],
 *   assignment: import('meriyah').ESTree.LogicalExpression,
 * }} acc
 *
 * @param {import('meriyah').ESTree.ImportClause}
 */
// prettier-ignore
export const staticImportReducer = (acc, { type, local, imported }) => ({
  ImportSpecifier() {
    acc['properties'] ??= [];
    acc.properties.push(initProp(imported.name, local.name));
    return acc;
  },
  ImportDefaultSpecifier() {
    acc['name'] = local.name;
    return acc;
  },
  ImportNamespaceSpecifier() {
    if (acc['name']) {
      // move global assignment of already used default import
      // to destructured property import, i.e. `({ default: name } = ...)`
      acc['properties'] ??= [];
      acc.properties.push(initProp('default', acc.name));
    }

    // replace the name and value to be assigned
    // from the default import to the namespace import
    acc['name'] = local.name;
    return acc;
  },
}[type]?.());

/**
 * @param {string} name
 * @param {boolean} cdn
 */
const resolveModule = (name, cdn) => {
  if (!cdn || isBuiltin(name) || name.startsWith('.') || name.startsWith('https:')) return name;
  let resolved = `https://cdn.jsdelivr.net/npm/${name}/+esm`;
  try {
    const require = createRequire(`${process.cwd()}/index.js`);
    if (require.resolve(name)) resolved = name;
  } catch (_) {}

  if (resolved !== name) {
    globalThis['cdn_imports'] ??= new Map();
    globalThis['cdn_imports'].set(name, resolved);
    console.info(chalk.italic.dim.green(`automatically resolving "${name}" from cdn...`));
  }

  return resolved;
};
